using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MessManagement.Api.Data;
using MessManagement.Api.Services;
using System.Security.Claims;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public DashboardController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet("today-stats")]
        [Authorize(Roles = "Admin,Staff,Student")]
        public async Task<IActionResult> GetTodayStats([FromQuery] DateTime? date = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date;
            
            var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;
            int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId);

            // Get total registered users by role
            var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalStaff = await _context.Users.CountAsync(u => u.Role == "Staff");

            // Calculate users on leave today for specific meals (approved only)
            var activeLeavesToday = await _context.Leaves
                .Include(l => l.User)
                .Where(l => l.Status == "Approved" 
                            && l.StartDate.Date <= targetDate 
                            && l.EndDate.Date >= targetDate)
                .ToListAsync();

            // Separate leaves by role
            var studentLeavesToday = activeLeavesToday.Where(l => l.User!.Role == "Student").ToList();
            var staffLeavesToday = activeLeavesToday.Where(l => l.User!.Role == "Staff").ToList();

            // Students on leave per meal
            var studentBreakfastLeaves = studentLeavesToday.Count(l => l.BreakfastLeave);
            var studentLunchLeaves = studentLeavesToday.Count(l => l.LunchLeave);
            var studentDinnerLeaves = studentLeavesToday.Count(l => l.DinnerLeave);

            // Staff on leave per meal
            var staffBreakfastLeaves = staffLeavesToday.Count(l => l.BreakfastLeave);
            var staffLunchLeaves = staffLeavesToday.Count(l => l.LunchLeave);
            var staffDinnerLeaves = staffLeavesToday.Count(l => l.DinnerLeave);

            // Total users on leave overall (for stat cards)
            var studentsOnLeave = studentLeavesToday.Select(l => l.UserId).Distinct().Count();
            var staffOnLeave = staffLeavesToday.Select(l => l.UserId).Distinct().Count();

            // Calculate expected counts for meals
            var expectedBreakfast = (totalStudents - studentBreakfastLeaves) + (totalStaff - staffBreakfastLeaves);
            var expectedLunch = (totalStudents - studentLunchLeaves) + (totalStaff - staffLunchLeaves);
            var expectedDinner = (totalStudents - studentDinnerLeaves) + (totalStaff - staffDinnerLeaves);
            var expectedStaffToday = totalStaff - staffOnLeave;

            // Calculate actual attendance for the day
            var attendanceQuery = _context.Attendances
                .Where(a => a.Date.Date == targetDate.Date && a.Status == "Present");

            if (currentRole == "Student")
            {
                attendanceQuery = attendanceQuery.Where(a => a.UserId == userId);
            }

            var actualAttendance = await attendanceQuery
                .GroupBy(a => a.MealType)
                .Select(g => new { MealType = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.MealType, g => g.Count);

            var actualBreakfast = actualAttendance.GetValueOrDefault("Breakfast", 0);
            var actualLunch = actualAttendance.GetValueOrDefault("Lunch", 0);
            var actualDinner = actualAttendance.GetValueOrDefault("Dinner", 0);

            // Additional stats
            decimal totalRevenue = 0;
            decimal totalDues = 0;
            decimal totalPaidByStudent = 0;

            if (currentRole == "Student")
            {
                totalDues = await _context.Payments
                    .Where(p => p.UserId == userId && (p.Status == "Pending" || p.Status == "Partial"))
                    .SumAsync(p => p.RemainingAmount);
                
                totalPaidByStudent = await _context.Payments
                    .Where(p => p.UserId == userId)
                    .SumAsync(p => p.PaidAmount);
            }
            else
            {
                totalRevenue = await _context.Payments
                    .Where(p => p.Status == "Paid" || p.Status == "Partial")
                    .SumAsync(p => p.PaidAmount);
                totalDues = await _context.Payments
                    .Where(p => p.Status == "Pending" || p.Status == "Partial")
                    .SumAsync(p => p.RemainingAmount);
            }

            int feedbackCount = 0;
            if (currentRole == "Student")
            {
                feedbackCount = await _context.Feedbacks.CountAsync(f => f.UserId == userId);
            }
            else
            {
                feedbackCount = await _context.Feedbacks.CountAsync();
            }

            var menuItemsCount = await _context.Menus.CountAsync();
            var dayOfWeek = targetDate.DayOfWeek.ToString();
            var todayMenu = await _context.Menus.FirstOrDefaultAsync(m => m.DayOfWeek == dayOfWeek);

            return Ok(new
            {
                totalStudents,
                totalStaff,
                studentsOnLeave,
                staffOnLeave,
                expectedBreakfast,
                expectedLunch,
                expectedDinner,
                expectedStaffToday,
                actualBreakfast,
                actualLunch,
                actualDinner,
                totalRevenue,
                totalDues,
                totalPaid = totalPaidByStudent,
                feedbackCount,
                menuItemsCount,
                todayMenu
            });
        }

        [HttpGet("my-weekly-attendance")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyWeeklyAttendance()
        {
            int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId);
            if (userId == 0) return Unauthorized();

            var today = DateTime.UtcNow.Date;
            var startDate = today.AddDays(-6); // Past 7 days including today

            var attendanceData = await _context.Attendances
                .Where(a => a.UserId == userId && a.Status == "Present" && a.Date.Date >= startDate && a.Date.Date <= today)
                .GroupBy(a => a.Date.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.Date, g => g.Count);

            var result = Enumerable.Range(0, 7)
                .Select(i => startDate.AddDays(i))
                .Select(day => new {
                    name = day.ToString("ddd"), // "Mon", "Tue"
                    meals = attendanceData.ContainsKey(day) ? attendanceData[day] : 0
                })
                .ToList();

            return Ok(result);
        }

        [HttpGet("weekly-total-meals")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetWeeklyTotalMeals()
        {
            var today = DateTime.UtcNow.Date;
            var startDate = today.AddDays(-6); // Past 7 days including today

            var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalStaff = await _context.Users.CountAsync(u => u.Role == "Staff");
            int baseExpected = (totalStudents * 3) + (totalStaff * 3); // 3 meals a day per user

            var leaves = await _context.Leaves
                .Where(l => l.Status == "Approved" && l.StartDate.Date <= today && l.EndDate.Date >= startDate)
                .ToListAsync();

            var attendances = await _context.Attendances
                .Include(a => a.User)
                .Where(a => a.Status == "Present" && a.Date.Date >= startDate && a.Date.Date <= today)
                .ToListAsync();

            var result = new List<object>();

            for (int i = 0; i < 7; i++)
            {
                var day = startDate.AddDays(i);
                var activeLeavesDay = leaves.Where(l => l.StartDate.Date <= day && l.EndDate.Date >= day).ToList();
                int baseBreakfast = totalStudents + totalStaff;
                int baseLunch = totalStudents + totalStaff;
                int baseDinner = totalStudents + totalStaff;

                int leaveBreakfast = activeLeavesDay.Sum(l => l.BreakfastLeave ? 1 : 0);
                int leaveLunch = activeLeavesDay.Sum(l => l.LunchLeave ? 1 : 0);
                int leaveDinner = activeLeavesDay.Sum(l => l.DinnerLeave ? 1 : 0);
                int leaveDeductions = leaveBreakfast + leaveLunch + leaveDinner;

                var dayAttendances = attendances.Where(a => a.Date.Date == day).ToList();

                result.Add(new {
                    name = day.ToString("ddd"),
                    expected = baseExpected - leaveDeductions,
                    expectedBreakfast = baseBreakfast - leaveBreakfast,
                    expectedLunch = baseLunch - leaveLunch,
                    expectedDinner = baseDinner - leaveDinner,
                    actual = dayAttendances.Count,
                    students = dayAttendances.Where(a => a.User != null && a.User.Role == "Student").Select(a => a.UserId).Distinct().Count(),
                    staff = dayAttendances.Where(a => a.User != null && a.User.Role == "Staff").Select(a => a.UserId).Distinct().Count()
                });
            }

            return Ok(result);
        }

        [HttpGet("smart-kitchen-stats")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetSmartKitchenStats([FromQuery] DateTime? date = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date;

            if (!await _context.MealVegetablePlans.AnyAsync(p => p.PlanDate.Date == targetDate.Date))
            {
                await _workflow.BuildMealPlanningRowsFromMenuAsync(targetDate.Date, "System", persistPlans: true);
            }

            var todaysPlans = await _context.MealVegetablePlans
                .Where(p => p.PlanDate.Date == targetDate.Date)
                .Select(p => new {
                    p.Id,
                    p.PlanDate,
                    p.MealType,
                    p.MenuItem,
                    IngredientId = p.VegetableId,
                    IngredientName = p.VegetableName,
                    RequiredQuantity = p.RequiredQuantity,
                    p.Unit,
                    p.TotalExpectedMealCount
                })
                .ToListAsync();

            var lowStockItems = await _context.InventoryItems
                .Where(i => i.Quantity <= i.MinimumStock && i.Status == "Active")
                .Include(i => i.Vendor)
                .ToListAsync();

            var pendingOrders = await _context.VendorOrders
                .Where(o => o.Status == "Pending" || o.Status == "Ordered")
                .Include(o => o.Vendor)
                .ToListAsync();

            var dailyUsages = await _context.DailyVegetableUsages
                .Where(u => u.UsageDate.Date == targetDate.Date)
                .ToListAsync();

            var todayUsedQuantity = dailyUsages.Sum(u => u.ActualUsedQuantity);
            var todayWastedQuantity = dailyUsages.Sum(u => u.WastedQuantity);

            var tomorrowSuggestions = await _workflow.BuildVendorSuggestionsAsync(targetDate.AddDays(1));

            var availableStock = await _context.InventoryItems
                .Where(i => i.Status == "Active")
                .Select(i => new {
                    i.InventoryId,
                    i.ItemName,
                    i.Category,
                    i.Quantity,
                    i.Unit,
                    i.MinimumStock,
                    i.SafetyStock,
                    i.StockStatus,
                    i.PurchasePrice
                })
                .ToListAsync();

            return Ok(new
            {
                todaysPlans,
                lowStockItems,
                pendingOrders,
                todayUsedQuantity,
                todayWastedQuantity,
                availableStock,
                tomorrowSuggestions,
                dailyUsages
            });
        }
    }
}
