using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MessManagement.Api.Controllers
{
    [Route("api/inventory")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")] // Only Admin and Staff can access this feature
    public class VegetablePlanningController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VegetablePlanningController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("vegetable-plans")]
        public async Task<IActionResult> GetVegetablePlans()
        {
            var plans = await _context.MealVegetablePlans.OrderByDescending(p => p.PlanDate).ToListAsync();
            return Ok(plans);
        }

        [HttpPost("vegetable-plans")]
        public async Task<IActionResult> AddVegetablePlan([FromBody] MealVegetablePlanDto dto)
        {
            if (dto.RequiredQuantity <= 0) return BadRequest("Required quantity must be greater than zero.");
            if (dto.ExpectedStudentCount < 0 || dto.ExpectedStaffCount < 0) return BadRequest("Expected counts cannot be negative.");

            var inventoryItem = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (inventoryItem == null) return BadRequest("Selected inventory item was not found.");

            var user = await GetCurrentUser();

            var plan = new MealVegetablePlan
            {
                PlanDate = dto.PlanDate,
                MealType = dto.MealType,
                MenuItemId = dto.MenuItemId,
                MenuItem = dto.MenuItem,
                VegetableId = inventoryItem.InventoryId,
                VegetableName = inventoryItem.ItemName,
                RequiredQuantity = dto.RequiredQuantity,
                Unit = inventoryItem.Unit,
                ExpectedStudentCount = dto.ExpectedStudentCount,
                ExpectedStaffCount = dto.ExpectedStaffCount,
                BufferCount = dto.BufferCount,
                TotalExpectedMealCount = dto.ExpectedStudentCount + dto.ExpectedStaffCount + dto.BufferCount,
                CreatedBy = user?.FullName
            };

            _context.MealVegetablePlans.Add(plan);
            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpPut("vegetable-plans/{id}")]
        public async Task<IActionResult> UpdateVegetablePlan(int id, [FromBody] MealVegetablePlanDto dto)
        {
            var plan = await _context.MealVegetablePlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found");
            if (dto.RequiredQuantity <= 0) return BadRequest("Required quantity must be greater than zero.");
            if (dto.ExpectedStudentCount < 0 || dto.ExpectedStaffCount < 0) return BadRequest("Expected counts cannot be negative.");

            var inventoryItem = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (inventoryItem == null) return BadRequest("Selected inventory item was not found.");

            plan.PlanDate = dto.PlanDate;
            plan.MealType = dto.MealType;
            plan.MenuItemId = dto.MenuItemId;
            plan.MenuItem = dto.MenuItem;
            plan.VegetableId = inventoryItem.InventoryId;
            plan.VegetableName = inventoryItem.ItemName;
            plan.RequiredQuantity = dto.RequiredQuantity;
            plan.Unit = inventoryItem.Unit;
            plan.ExpectedStudentCount = dto.ExpectedStudentCount;
            plan.ExpectedStaffCount = dto.ExpectedStaffCount;
            plan.BufferCount = dto.BufferCount;
            plan.TotalExpectedMealCount = dto.ExpectedStudentCount + dto.ExpectedStaffCount + dto.BufferCount;

            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpDelete("vegetable-plans/{id}")]
        public async Task<IActionResult> DeleteVegetablePlan(int id)
        {
            var plan = await _context.MealVegetablePlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found");

            _context.MealVegetablePlans.Remove(plan);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Plan deleted successfully" });
        }

        [HttpGet("vegetable-usage")]
        public async Task<IActionResult> GetVegetableUsage()
        {
            var usage = await _context.DailyVegetableUsages.OrderByDescending(u => u.UsageDate).ToListAsync();
            return Ok(usage);
        }

        [HttpPost("vegetable-usage")]
        public async Task<IActionResult> AddVegetableUsage([FromBody] DailyVegetableUsageDto dto)
        {
            if (dto.PlannedQuantity < 0 || dto.ActualUsedQuantity < 0 || dto.WastedQuantity < 0)
            {
                return BadRequest("Quantities cannot be negative.");
            }

            var inventoryItem = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (inventoryItem == null) return BadRequest("Selected inventory item was not found.");

            var totalDeduction = dto.ActualUsedQuantity + dto.WastedQuantity;
            if (totalDeduction <= 0) return BadRequest("Actual used or wasted quantity must be greater than zero.");
            if (inventoryItem.Quantity < totalDeduction) return BadRequest("Insufficient stock for this usage entry.");

            var duplicateExists = await _context.DailyVegetableUsages.AnyAsync(u =>
                u.UsageDate.Date == dto.UsageDate.Date &&
                u.MealType == dto.MealType &&
                u.VegetableId == dto.VegetableId);
            if (duplicateExists) return Conflict("Usage is already recorded for this item, meal, and date.");

            var user = await GetCurrentUser();

            decimal remaining = dto.PlannedQuantity - dto.ActualUsedQuantity - dto.WastedQuantity;
            string status = "Properly Used";

            if (dto.ActualUsedQuantity == 0) status = "Not Used";
            else if (dto.ActualUsedQuantity < dto.PlannedQuantity) status = "Under Used";
            else if (dto.ActualUsedQuantity > dto.PlannedQuantity) status = "Over Used";

            var usage = new DailyVegetableUsage
            {
                UsageDate = dto.UsageDate,
                MealType = dto.MealType,
                PlanId = dto.PlanId,
                MenuItem = dto.MenuItem,
                VegetableId = inventoryItem.InventoryId,
                VegetableName = inventoryItem.ItemName,
                PlannedQuantity = dto.PlannedQuantity,
                ActualUsedQuantity = dto.ActualUsedQuantity,
                WastedQuantity = dto.WastedQuantity,
                RemainingQuantity = remaining,
                UsageStatus = status,
                Remarks = dto.Remarks,
                CreatedBy = user?.FullName
            };

            _context.DailyVegetableUsages.Add(usage);

            inventoryItem.Quantity -= totalDeduction;
            inventoryItem.LastUpdated = DateTime.UtcNow;
            inventoryItem.StockStatus = GetStockStatus(inventoryItem.Quantity, inventoryItem.MinimumStock);

            var transaction = new InventoryTransaction
            {
                InventoryId = inventoryItem.InventoryId,
                Type = "Stock Out",
                Quantity = totalDeduction,
                Remarks = $"Used in {dto.MealType} on {dto.UsageDate:dd-MMM-yyyy}",
                CreatedBy = user?.FullName
            };
            _context.InventoryTransactions.Add(transaction);

            await _context.SaveChangesAsync();
            return Ok(usage);
        }

        [HttpGet("previous-day-analysis")]
        public async Task<IActionResult> GetPreviousDayAnalysis([FromQuery] DateTime? date)
        {
            var targetDate = date ?? DateTime.UtcNow.AddDays(-1).Date;
            var usages = await _context.DailyVegetableUsages
                .Where(u => u.UsageDate.Date == targetDate.Date)
                .ToListAsync();

            return Ok(usages);
        }

        [HttpGet("vendor-order-suggestions")]
        public async Task<IActionResult> GetVendorOrderSuggestions([FromQuery] DateTime? date)
        {
            var targetDate = date ?? DateTime.UtcNow.AddDays(1).Date;
            
            // Re-calculate suggestions dynamically based on plans for target date
            var plans = await _context.MealVegetablePlans
                .Where(p => p.PlanDate.Date == targetDate.Date)
                .GroupBy(p => p.VegetableId)
                .Select(g => new {
                    VegetableId = g.Key,
                    TotalRequired = g.Sum(p => p.RequiredQuantity)
                })
                .ToListAsync();

            var suggestions = new List<VendorOrderSuggestion>();
            var placedOrders = await _context.VendorOrderSuggestions
                .Where(o => o.OrderDate.Date == targetDate.Date)
                .ToListAsync();

            foreach (var plan in plans)
            {
                var item = await _context.InventoryItems
                    .Include(i => i.Vendor)
                    .FirstOrDefaultAsync(i => i.InventoryId == plan.VegetableId);

                if (item != null)
                {
                    decimal safetyStock = item.SafetyStock > 0 ? item.SafetyStock : item.MinimumStock;
                    decimal suggestedOrder = plan.TotalRequired - item.Quantity + safetyStock;
                    if (suggestedOrder < 0) suggestedOrder = 0;

                    var placedOrder = placedOrders.FirstOrDefault(o => o.VegetableId == item.InventoryId);

                    string recommendation = "Use Existing Stock";
                    if (placedOrder != null) recommendation = "Order Placed";
                    else if (suggestedOrder > 0) recommendation = "Order Now";
                    else if (item.Quantity > plan.TotalRequired * 3) recommendation = "Overstock Alert";
                    else if (item.ExpiryDate.HasValue && (item.ExpiryDate.Value - DateTime.UtcNow).TotalDays < 3) recommendation = "Near Expiry Use First";
                    else if (item.Quantity <= item.MinimumStock) recommendation = "Low Stock Alert";

                    suggestions.Add(new VendorOrderSuggestion
                    {
                        OrderDate = targetDate,
                        VegetableId = item.InventoryId,
                        VegetableName = item.ItemName,
                        AvailableStock = item.Quantity,
                        NextDayRequiredQuantity = plan.TotalRequired,
                        SafetyStock = safetyStock,
                        SuggestedOrderQuantity = placedOrder?.SuggestedOrderQuantity ?? suggestedOrder,
                        PreferredVendorId = placedOrder?.PreferredVendorId ?? item.VendorId,
                        PreferredVendorName = placedOrder?.PreferredVendorName ?? item.Vendor?.VendorName,
                        LastPurchaseRate = item.PurchasePrice,
                        EstimatedCost = placedOrder?.EstimatedCost ?? suggestedOrder * item.PurchasePrice,
                        RecommendationStatus = recommendation
                    });
                }
            }

            return Ok(suggestions);
        }
        
        [HttpPost("vendor-orders")]
        public async Task<IActionResult> PlaceVendorOrders([FromBody] List<VendorOrderSuggestion> orders)
        {
            var validOrders = orders
                .Where(o => o.SuggestedOrderQuantity > 0)
                .ToList();

            if (!validOrders.Any()) return BadRequest("No order quantities were provided.");

            foreach (var order in validOrders)
            {
                var item = await _context.InventoryItems.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.InventoryId == order.VegetableId);
                if (item == null) continue;

                var existing = await _context.VendorOrderSuggestions.FirstOrDefaultAsync(o =>
                    o.OrderDate.Date == order.OrderDate.Date &&
                    o.VegetableId == order.VegetableId);

                if (existing != null)
                {
                    _context.VendorOrderSuggestions.Remove(existing);
                }

                _context.VendorOrderSuggestions.Add(new VendorOrderSuggestion
                {
                    OrderDate = order.OrderDate.Date,
                    VegetableId = order.VegetableId,
                    VegetableName = order.VegetableName,
                    AvailableStock = order.AvailableStock,
                    NextDayRequiredQuantity = order.NextDayRequiredQuantity,
                    SafetyStock = order.SafetyStock,
                    SuggestedOrderQuantity = order.SuggestedOrderQuantity,
                    PreferredVendorId = order.PreferredVendorId,
                    PreferredVendorName = order.PreferredVendorName,
                    LastPurchaseRate = order.LastPurchaseRate,
                    EstimatedCost = order.EstimatedCost,
                    RecommendationStatus = "Order Placed",
                    CreatedAt = DateTime.UtcNow
                });

                _context.VendorOrders.Add(new VendorOrder
                {
                    VendorId = order.PreferredVendorId ?? item.VendorId,
                    VendorName = order.PreferredVendorName ?? item.Vendor?.VendorName,
                    IngredientId = item.InventoryId,
                    IngredientName = item.ItemName,
                    Quantity = order.SuggestedOrderQuantity,
                    Unit = item.Unit,
                    Rate = order.LastPurchaseRate > 0 ? order.LastPurchaseRate : item.PurchasePrice,
                    TotalAmount = order.EstimatedCost,
                    OrderDate = DateTime.UtcNow.Date,
                    ExpectedDeliveryDate = order.OrderDate.Date,
                    Status = "Pending",
                    CreatedBy = (await GetCurrentUser())?.FullName
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Orders processed successfully" });
        }

        private async Task<User?> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(userId, out var id) ? await _context.Users.FindAsync(id) : null;
        }

        private static string GetStockStatus(decimal quantity, decimal minimumStock)
        {
            if (quantity <= 0) return "Out of Stock";
            return quantity <= minimumStock ? "Low Stock" : "In Stock";
        }
    }
}
