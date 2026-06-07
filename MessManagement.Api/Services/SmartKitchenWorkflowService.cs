using MessManagement.Api.Data;
using MessManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Services
{
    public class SmartKitchenWorkflowService
    {
        private readonly AppDbContext _context;

        private static readonly System.Threading.SemaphoreSlim _recalculateLock = new System.Threading.SemaphoreSlim(1, 1);

        public SmartKitchenWorkflowService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MealVegetablePlan>> RecalculateMealPlanAsync(
            DateTime planDate,
            string mealType,
            int bufferCount = 0,
            int? expectedStudents = null,
            int? expectedStaff = null,
            string? menuItemsOverride = null,
            string? createdBy = null)
        {
            await _recalculateLock.WaitAsync();
            try
            {
            var targetDate = planDate.Date;
            var menuItems = await ResolveMenuItems(targetDate, mealType, menuItemsOverride);
            var oldCalculatedPlans = await _context.MealVegetablePlans
                .Where(p => p.PlanDate.Date == targetDate && p.MealType == mealType && p.CalculatedStatus == "Calculated")
                .ToListAsync();

            _context.MealVegetablePlans.RemoveRange(oldCalculatedPlans);

            if (menuItems.Count == 0)
            {
                await _context.SaveChangesAsync();
                return new List<MealVegetablePlan>();
            }

            var expectedCount = await GetExpectedMealCount(targetDate, mealType, bufferCount, expectedStudents, expectedStaff);

            var normalizedMenuItems = menuItems.Select(NormalizeName).ToList();
            var allMappings = await _context.MenuIngredientMappings
                .Include(m => m.Ingredient)
                .Where(m => m.IsRequired &&
                            m.Ingredient != null &&
                            m.Ingredient.UseInMealPlanning &&
                            m.Ingredient.Status == "Active")
                .ToListAsync();

            var mappings = allMappings
                .Where(m => normalizedMenuItems.Any(mi => mi.Contains((m.MenuItem ?? "").ToLower()) || (m.MenuItem ?? "").ToLower().Contains(mi)) &&
                            (string.IsNullOrEmpty(m.MealType) || m.MealType.ToLower() == mealType.ToLower()))
                .ToList();

            var grouped = mappings
                .GroupBy(m => new { m.IngredientId, m.IngredientName, m.Unit })
                .Select(g => new
                {
                    g.Key.IngredientId,
                    g.Key.IngredientName,
                    g.Key.Unit,
                    RequiredQuantity = g.Sum(m => m.QuantityPerPerson * expectedCount.TotalExpectedCount),
                    MenuItem = string.Join(", ", g.Select(m => m.MenuItem).Distinct())
                })
                .ToList();

            var plans = new List<MealVegetablePlan>();
            foreach (var ingredient in grouped)
            {
                var item = await _context.InventoryItems.FindAsync(ingredient.IngredientId);
                if (item == null) continue;

                plans.Add(new MealVegetablePlan
                {
                    PlanDate = targetDate,
                    MealType = mealType,
                    MenuItem = ingredient.MenuItem,
                    VegetableId = item.InventoryId,
                    VegetableName = item.ItemName,
                    RequiredQuantity = ingredient.RequiredQuantity,
                    Unit = item.Unit,
                    ExpectedStudentCount = expectedCount.ExpectedStudents,
                    ExpectedStaffCount = expectedCount.ExpectedStaff,
                    ApprovedLeaveCount = expectedCount.ApprovedLeaves,
                    StaffAttendanceCount = expectedCount.StaffAttendance,
                    AttendanceTrendCount = expectedCount.AttendanceTrend,
                    BufferCount = expectedCount.BufferCount,
                    TotalExpectedMealCount = expectedCount.TotalExpectedCount,
                    CalculatedStatus = "Calculated",
                    CreatedBy = createdBy
                });
            }

            _context.MealVegetablePlans.AddRange(plans);
            await _context.SaveChangesAsync();
            return plans;
            }
            finally
            {
                _recalculateLock.Release();
            }
        }

        public async Task RecalculateMenuWeekAsync(string dayOfWeek, string? createdBy = null)
        {
            var today = DateTime.UtcNow.Date;
            for (var i = 0; i < 14; i++)
            {
                var date = today.AddDays(i);
                if (!date.DayOfWeek.ToString().Equals(dayOfWeek, StringComparison.OrdinalIgnoreCase)) continue;

                await RecalculateMealPlanAsync(date, "Breakfast", createdBy: createdBy);
                await RecalculateMealPlanAsync(date, "Lunch", createdBy: createdBy);
                await RecalculateMealPlanAsync(date, "Dinner", createdBy: createdBy);
            }
        }

        public async Task<List<object>> BuildMealPlanningRowsFromMenuAsync(DateTime planDate, string? createdBy = null, bool persistPlans = true)
        {
            var targetDate = planDate.Date;
            var rows = new List<object>();
            var menu = await _context.Menus.FirstOrDefaultAsync(m => m.DayOfWeek == targetDate.DayOfWeek.ToString());
            if (menu == null) return rows;

            foreach (var mealType in new[] { "Breakfast", "Lunch", "Dinner" })
            {
                if (persistPlans)
                {
                    await RecalculateMealPlanAsync(targetDate, mealType, createdBy: createdBy);
                }

                var menuText = mealType switch
                {
                    "Breakfast" => menu.Breakfast,
                    "Lunch" => menu.Lunch,
                    "Dinner" => menu.Dinner,
                    _ => string.Empty
                };

                var menuItems = SplitMenuItems(menuText);
                var expectedCount = await GetExpectedMealCount(targetDate, mealType, 0, null, null);
                var normalizedItems = menuItems.Select(NormalizeName).ToList();
                var allMappings = await _context.MenuIngredientMappings
                    .Include(m => m.Ingredient)
                    .Where(m => m.IsRequired &&
                                m.Ingredient != null &&
                                m.Ingredient.UseInMealPlanning &&
                                m.Ingredient.Status == "Active")
                    .ToListAsync();

                var mappings = allMappings
                    .Where(m => normalizedItems.Any(mi => mi.Contains((m.MenuItem ?? "").ToLower()) || (m.MenuItem ?? "").ToLower().Contains(mi)) &&
                                (string.IsNullOrEmpty(m.MealType) || m.MealType.ToLower() == mealType.ToLower()))
                    .OrderBy(m => m.MenuItem)
                    .ThenBy(m => m.IngredientName)
                    .ToList();

                foreach (var mapping in mappings)
                {
                    var item = mapping.Ingredient ?? await _context.InventoryItems.FindAsync(mapping.IngredientId);
                    if (item == null) continue;

                    var plan = await _context.MealVegetablePlans
                        .Where(p => p.PlanDate.Date == targetDate && p.MealType == mealType && p.VegetableId == item.InventoryId)
                        .OrderByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();

                    var finalRequired = plan != null ? plan.RequiredQuantity : mapping.QuantityPerPerson * expectedCount.TotalExpectedCount;
                    var finalShortage = Math.Max(0, finalRequired - item.Quantity);
                    var finalExpectedStudents = plan != null ? plan.ExpectedStudentCount : expectedCount.ExpectedStudents;
                    var finalExpectedStaff = plan != null ? plan.ExpectedStaffCount : expectedCount.ExpectedStaff;
                    var finalBuffer = plan != null ? plan.BufferCount : expectedCount.BufferCount;
                    var finalExpectedTotal = plan != null ? plan.TotalExpectedMealCount : expectedCount.TotalExpectedCount;

                    rows.Add(new
                    {
                        date = targetDate,
                        mealType,
                        menuItemId = mapping.MenuItemId,
                        menuItem = mapping.MenuItemName ?? mapping.MenuItem,
                        ingredientId = item.InventoryId,
                        ingredientName = item.ItemName,
                        quantityPerPerson = mapping.QuantityPerPerson,
                        expectedStudentCount = finalExpectedStudents,
                        expectedStaffCount = finalExpectedStaff,
                        approvedLeaveCount = plan != null ? plan.ApprovedLeaveCount : expectedCount.ApprovedLeaves,
                        staffAttendanceCount = plan != null ? plan.StaffAttendanceCount : expectedCount.StaffAttendance,
                        attendanceTrendCount = plan != null ? plan.AttendanceTrendCount : expectedCount.AttendanceTrend,
                        bufferCount = finalBuffer,
                        expectedCount = finalExpectedTotal,
                        requiredQuantity = finalRequired,
                        availableStock = item.Quantity,
                        availableQuantity = item.Quantity,
                        shortageQuantity = finalShortage,
                        lowStockAlert = item.Quantity <= item.MinimumStock,
                        nearExpiryWarning = item.ExpiryDate.HasValue && item.ExpiryDate.Value.Date <= DateTime.UtcNow.Date.AddDays(3),
                        status = GetInventoryStatus(item, finalRequired),
                        stockStatus = GetInventoryStatus(item, finalRequired),
                        unit = item.Unit,
                        planId = plan?.Id,
                        warning = plan != null && menu.LastUpdated > plan.CreatedAt ? "Menu changed after planning. Recalculate before usage." : null
                    });
                }
            }

            return rows;
        }

        public async Task<List<object>> BuildVendorSuggestionsAsync(DateTime orderForDate)
        {
            var targetDate = orderForDate.Date;
            if (!await _context.MealVegetablePlans.AnyAsync(p => p.PlanDate.Date == targetDate))
            {
                await BuildMealPlanningRowsFromMenuAsync(targetDate, persistPlans: true);
            }

            var plans = await _context.MealVegetablePlans
                .Where(p => p.PlanDate.Date == targetDate)
                .GroupBy(p => p.VegetableId)
                .Select(g => new { IngredientId = g.Key, Required = g.Sum(p => p.RequiredQuantity) })
                .ToListAsync();

            var result = new List<object>();
            foreach (var plan in plans)
            {
                var item = await _context.InventoryItems
                    .Include(i => i.Vendor)
                    .FirstOrDefaultAsync(i => i.InventoryId == plan.IngredientId);
                if (item == null) continue;

                var safetyStock = item.SafetyStock > 0 ? item.SafetyStock : item.MinimumStock;
                var suggestedQuantity = Math.Max(0, plan.Required + safetyStock - item.Quantity);
                var recommendation = GetRecommendationStatus(item, plan.Required, suggestedQuantity);

                result.Add(new
                {
                    ingredientId = item.InventoryId,
                    vegetableId = item.InventoryId,
                    ingredientName = item.ItemName,
                    vegetableName = item.ItemName,
                    tomorrowRequiredQuantity = plan.Required,
                    nextDayRequiredQuantity = plan.Required,
                    availableStock = item.Quantity,
                    safetyStock,
                    suggestedOrderQuantity = suggestedQuantity,
                    preferredVendorId = item.VendorId,
                    preferredVendorName = item.Vendor?.VendorName,
                    lastPurchaseRate = item.PurchasePrice,
                    estimatedCost = suggestedQuantity * item.PurchasePrice,
                    unit = item.Unit,
                    recommendationStatus = recommendation
                });
            }

            return result;
        }

        public static string GetInventoryStatus(InventoryItem item, decimal requiredQuantity = 0)
        {
            if (item.ExpiryDate.HasValue && item.ExpiryDate.Value.Date <= DateTime.UtcNow.Date.AddDays(3)) return "Near Expiry";
            if (requiredQuantity > 0 && item.Quantity < requiredQuantity) return "Shortage";
            if (item.Quantity <= 0) return "Shortage";
            if (item.Quantity <= item.MinimumStock) return "Low Stock";
            if (requiredQuantity > 0 && item.Quantity > requiredQuantity * 3) return "Overstock";
            return "Available";
        }

        public static string GetUsageStatus(decimal planned, decimal actual, decimal wasted)
        {
            if (actual == 0 && wasted == 0) return "Not Used";
            if (wasted > 0 && actual <= planned) return "Wasted";
            if (actual < planned) return "Under Used";
            if (actual > planned) return "Over Used";
            return "Properly Used";
        }

        private async Task<List<string>> ResolveMenuItems(DateTime date, string mealType, string? menuItemsOverride)
        {
            var raw = menuItemsOverride;
            if (string.IsNullOrWhiteSpace(raw))
            {
                var menu = await _context.Menus.FirstOrDefaultAsync(m => m.DayOfWeek == date.DayOfWeek.ToString());
                raw = mealType switch
                {
                    "Breakfast" => menu?.Breakfast,
                    "Lunch" => menu?.Lunch,
                    "Dinner" => menu?.Dinner,
                    _ => null
                };
            }

            return SplitMenuItems(raw);
        }

        private static List<string> SplitMenuItems(string? raw)
        {
            return (raw ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(NormalizeMenuLabel)
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public async Task<(int ExpectedStudents, int ExpectedStaff, int ApprovedLeaves, int StaffAttendance, int AttendanceTrend, int BufferCount, int TotalExpectedCount)> GetExpectedMealCount(
            DateTime date,
            string mealType,
            int bufferCount,
            int? expectedStudents,
            int? expectedStaff)
        {
            var totalStudentCount = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalStaffCount = await _context.Users.CountAsync(u => u.Role == "Staff");
            
            var leaves = await _context.Leaves
                .Include(l => l.User)
                .Where(l => l.Status == "Approved" && l.StartDate.Date <= date.Date && l.EndDate.Date >= date.Date)
                .ToListAsync();

            var relevantLeaves = mealType switch
            {
                "Breakfast" => leaves.Where(l => l.BreakfastLeave),
                "Lunch" => leaves.Where(l => l.LunchLeave),
                "Dinner" => leaves.Where(l => l.DinnerLeave),
                _ => leaves
            };

            var studentLeaves = relevantLeaves.Count(l => l.User?.Role == "Student");
            var staffLeaves = relevantLeaves.Count(l => l.User?.Role == "Staff");
            var approvedLeaves = studentLeaves + staffLeaves;

            var studentAttendance = await CountStudentAttendance(date, mealType);
            var staffAttendance = await CountStaffAttendance(date, mealType);

            // Link expected count directly to dashboard expected logic (Total registered minus leaves for specific meal type)
            var expectedStudentCount = expectedStudents ?? Math.Max(0, totalStudentCount - studentLeaves);
            var expectedStaffCount = expectedStaff ?? Math.Max(0, totalStaffCount - staffLeaves);

            var trendCount = await CountMealAttendanceTrend(date, mealType);
            var totalExpected = Math.Max(0, expectedStudentCount + expectedStaffCount + bufferCount);

            return (expectedStudentCount, expectedStaffCount, approvedLeaves, staffAttendance, trendCount, bufferCount, totalExpected);
        }

        private Task<int> CountStudentAttendance(DateTime date, string mealType)
        {
            return _context.Attendances
                .Include(a => a.User)
                .CountAsync(a => a.Date.Date == date && a.MealType == mealType && a.Status == "Present" && a.User != null && a.User.Role == "Student");
        }

        private async Task<int> CountApprovedLeaves(DateTime date, string mealType)
        {
            var leaves = await _context.Leaves
                .Where(l => l.Status == "Approved" && l.StartDate.Date <= date.Date && l.EndDate.Date >= date.Date)
                .ToListAsync();

            return mealType switch
            {
                "Breakfast" => leaves.Count(l => l.BreakfastLeave),
                "Lunch" => leaves.Count(l => l.LunchLeave),
                "Dinner" => leaves.Count(l => l.DinnerLeave),
                _ => leaves.Count
            };
        }

        private Task<int> CountStaffAttendance(DateTime date, string mealType)
        {
            return _context.Attendances
                .Include(a => a.User)
                .CountAsync(a => a.Date.Date == date && a.MealType == mealType && a.Status == "Present" && a.User != null && a.User.Role == "Staff");
        }

        private async Task<int> CountMealAttendanceTrend(DateTime date, string mealType)
        {
            var startDate = date.AddDays(-7);
            var counts = await _context.Attendances
                .Where(a => a.Date.Date >= startDate && a.Date.Date < date && a.MealType == mealType && a.Status == "Present")
                .GroupBy(a => a.Date.Date)
                .Select(g => g.Count())
                .ToListAsync();

            return counts.Count == 0 ? 0 : Convert.ToInt32(Math.Round(counts.Average()));
        }

        private static string GetRecommendationStatus(InventoryItem item, decimal required, decimal suggestedQuantity)
        {
            if (item.ExpiryDate.HasValue && item.ExpiryDate.Value.Date <= DateTime.UtcNow.Date.AddDays(3)) return "Near Expiry Use First";
            if (suggestedQuantity > 0) return item.Quantity <= item.MinimumStock ? "Low Stock Alert" : "Order Now";
            if (required > 0 && item.Quantity > required * 3) return "Overstock Alert";
            return "Use Existing Stock";
        }

        private static string NormalizeMenuLabel(string value)
        {
            return value.Trim();
        }

        private static string NormalizeName(string value)
        {
            return value.Trim().ToLower();
        }
    }
}
