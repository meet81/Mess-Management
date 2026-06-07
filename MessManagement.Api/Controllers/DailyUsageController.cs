using MessManagement.Api.Data;
using MessManagement.Api.DTOs;
using MessManagement.Api.Models;
using MessManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MessManagement.Api.Controllers
{
    [Route("api/daily-usage")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class DailyUsageController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public DailyUsageController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsage([FromQuery] DateTime? date = null)
        {
            var query = _context.DailyVegetableUsages.AsQueryable();
            if (date.HasValue) query = query.Where(u => u.UsageDate.Date == date.Value.Date);

            return Ok(await query.OrderByDescending(u => u.UsageDate).ThenBy(u => u.MealType).ToListAsync());
        }

        [HttpGet("from-plan")]
        public async Task<IActionResult> GetFromPlan([FromQuery] DateTime date)
        {
            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(
                date == default ? DateTime.UtcNow.Date : date.Date,
                User.FindFirstValue(ClaimTypes.Name),
                persistPlans: true);

            return Ok(rows);
        }

        [HttpPost("preview")]
        public IActionResult PreviewUsage([FromBody] DailyVegetableUsageDto dto)
        {
            var remaining = dto.PlannedQuantity - dto.ActualUsedQuantity - dto.WastedQuantity;
            return Ok(new
            {
                dto.PlanId,
                dto.UsageDate,
                dto.MealType,
                dto.MenuItem,
                ingredientId = dto.VegetableId,
                dto.PlannedQuantity,
                dto.ActualUsedQuantity,
                dto.WastedQuantity,
                remainingQuantity = remaining,
                usageStatus = SmartKitchenWorkflowService.GetUsageStatus(dto.PlannedQuantity, dto.ActualUsedQuantity, dto.WastedQuantity),
                dto.MarkMealPrepared,
                dto.DeductStockFromInventory,
                dto.WastageCannotBeReused,
                dto.ConfirmUsageEntry,
                dto.Remarks
            });
        }

        [HttpPost]
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitUsage([FromBody] DailyVegetableUsageDto dto)
        {
            if (dto.PlannedQuantity < 0 || dto.ActualUsedQuantity < 0 || dto.WastedQuantity < 0)
            {
                return BadRequest("Quantities cannot be negative.");
            }

            if (!dto.ConfirmUsageEntry) return BadRequest("Please confirm the usage entry before submitting.");

            var item = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (item == null) return BadRequest("Selected inventory item was not found.");

            var totalDeduction = dto.DeductStockFromInventory
                ? dto.ActualUsedQuantity + (dto.WastageCannotBeReused ? dto.WastedQuantity : 0)
                : 0;
            if (dto.MarkMealPrepared && dto.ActualUsedQuantity == 0 && dto.WastedQuantity == 0)
            {
                totalDeduction = 0;
            }
            if (totalDeduction > 0 && item.Quantity < totalDeduction) return BadRequest("Insufficient stock for this usage entry.");

            var duplicateExists = await _context.DailyVegetableUsages.AnyAsync(u =>
                u.UsageDate.Date == dto.UsageDate.Date &&
                u.MealType == dto.MealType &&
                u.VegetableId == dto.VegetableId &&
                (dto.PlanId == null || u.PlanId == dto.PlanId));
            if (duplicateExists) return Conflict("Usage is already recorded for this item, meal, and date.");

            var usage = new DailyVegetableUsage
            {
                PlanId = dto.PlanId,
                UsageDate = dto.UsageDate.Date,
                MealType = dto.MealType,
                MenuItem = dto.MenuItem,
                VegetableId = item.InventoryId,
                VegetableName = item.ItemName,
                PlannedQuantity = dto.PlannedQuantity,
                ActualUsedQuantity = dto.ActualUsedQuantity,
                WastedQuantity = dto.WastedQuantity,
                RemainingQuantity = dto.PlannedQuantity - dto.ActualUsedQuantity - dto.WastedQuantity,
                UsageStatus = SmartKitchenWorkflowService.GetUsageStatus(dto.PlannedQuantity, dto.ActualUsedQuantity, dto.WastedQuantity),
                MarkMealPrepared = dto.MarkMealPrepared,
                DeductedFromInventory = dto.DeductStockFromInventory,
                WastageCannotBeReused = dto.WastageCannotBeReused,
                ConfirmedUsageEntry = dto.ConfirmUsageEntry,
                Remarks = dto.Remarks,
                CreatedBy = User.FindFirstValue(ClaimTypes.Name)
            };

            _context.DailyVegetableUsages.Add(usage);

            if (totalDeduction > 0)
            {
                item.Quantity -= totalDeduction;
                item.LastUpdated = DateTime.UtcNow;
                item.StockStatus = item.Quantity <= item.MinimumStock ? (item.Quantity <= 0 ? "Out of Stock" : "Low Stock") : "In Stock";
                usage.LowStockAlertSent = dto.SendLowStockAlertAfterDeduction && item.AlertWhenLowStock && item.Quantity <= item.MinimumStock;

                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    InventoryId = item.InventoryId,
                    Type = "Stock Out",
                    Quantity = totalDeduction,
                    Remarks = $"Daily usage: {dto.MealType} on {dto.UsageDate:dd-MMM-yyyy}",
                    CreatedBy = User.FindFirstValue(ClaimTypes.Name)
                });
            }

            await _context.SaveChangesAsync();
            return Ok(usage);
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmUsage([FromBody] DailyVegetableUsageDto dto)
        {
            return await SubmitUsage(dto);
        }
    }
}
