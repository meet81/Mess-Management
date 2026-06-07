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
    [Route("api/meal-plans")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class MealPlansController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public MealPlansController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetMealPlans([FromQuery] DateTime? date = null, [FromQuery] string? mealType = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date;
            if (!await _context.MealVegetablePlans.AnyAsync(p => p.PlanDate.Date == targetDate))
            {
                await _workflow.BuildMealPlanningRowsFromMenuAsync(targetDate, User.FindFirstValue(ClaimTypes.Name) ?? "System", persistPlans: true);
            }

            var query = _context.MealVegetablePlans.AsQueryable();
            if (date.HasValue) query = query.Where(p => p.PlanDate.Date == date.Value.Date);
            if (!string.IsNullOrWhiteSpace(mealType)) query = query.Where(p => p.MealType == mealType);

            var plans = await query
                .OrderByDescending(p => p.PlanDate)
                .ThenBy(p => p.MealType)
                .ThenBy(p => p.VegetableName)
                .ToListAsync();

            var stock = await _context.InventoryItems.ToDictionaryAsync(i => i.InventoryId);
            var result = plans.Select(p =>
            {
                stock.TryGetValue(p.VegetableId, out var item);
                var available = item?.Quantity ?? 0;
                var shortage = Math.Max(0, p.RequiredQuantity - available);
                return new
                {
                    planId = p.Id,
                    p.Id,
                    p.PlanDate,
                    p.MealType,
                    p.MenuItemId,
                    p.MenuItem,
                    ingredientId = p.VegetableId,
                    vegetableId = p.VegetableId,
                    ingredientName = p.VegetableName,
                    vegetableName = p.VegetableName,
                    requiredQuantity = p.RequiredQuantity,
                    availableQuantity = available,
                    shortageQuantity = shortage,
                    p.Unit,
                    stockStatus = item == null ? "Shortage" : SmartKitchenWorkflowService.GetInventoryStatus(item, p.RequiredQuantity),
                    p.ExpectedStudentCount,
                    p.ExpectedStaffCount,
                    p.ApprovedLeaveCount,
                    p.StaffAttendanceCount,
                    p.AttendanceTrendCount,
                    p.BufferCount,
                    p.TotalExpectedMealCount,
                    p.CalculatedStatus
                };
            });

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddMealPlan([FromBody] MealVegetablePlanDto dto)
        {
            if (dto.RequiredQuantity <= 0) return BadRequest("Required quantity must be greater than zero.");
            var item = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (item == null) return BadRequest("Selected inventory item was not found.");

            var plan = new MealVegetablePlan
            {
                PlanDate = dto.PlanDate.Date,
                MealType = dto.MealType,
                MenuItemId = dto.MenuItemId,
                MenuItem = dto.MenuItem,
                VegetableId = item.InventoryId,
                VegetableName = item.ItemName,
                RequiredQuantity = dto.RequiredQuantity,
                Unit = item.Unit,
                ExpectedStudentCount = dto.ExpectedStudentCount,
                ExpectedStaffCount = dto.ExpectedStaffCount,
                BufferCount = dto.BufferCount,
                TotalExpectedMealCount = dto.ExpectedStudentCount + dto.ExpectedStaffCount + dto.BufferCount,
                CalculatedStatus = "Manual",
                CreatedBy = User.FindFirstValue(ClaimTypes.Name)
            };

            _context.MealVegetablePlans.Add(plan);
            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMealPlan(int id, [FromBody] MealVegetablePlanDto dto)
        {
            var plan = await _context.MealVegetablePlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");
            var item = await _context.InventoryItems.FindAsync(dto.VegetableId);
            if (item == null) return BadRequest("Selected inventory item was not found.");

            plan.PlanDate = dto.PlanDate.Date;
            plan.MealType = dto.MealType;
            plan.MenuItemId = dto.MenuItemId;
            plan.MenuItem = dto.MenuItem;
            plan.VegetableId = item.InventoryId;
            plan.VegetableName = item.ItemName;
            plan.RequiredQuantity = dto.RequiredQuantity;
            plan.Unit = item.Unit;
            plan.ExpectedStudentCount = dto.ExpectedStudentCount;
            plan.ExpectedStaffCount = dto.ExpectedStaffCount;
            plan.BufferCount = dto.BufferCount;
            plan.TotalExpectedMealCount = dto.ExpectedStudentCount + dto.ExpectedStaffCount + dto.BufferCount;
            plan.CalculatedStatus = "Manual";

            await _context.SaveChangesAsync();
            return Ok(plan);
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> Calculate([FromBody] MealPlanCalculateDto dto)
        {
            var plans = await _workflow.RecalculateMealPlanAsync(
                dto.PlanDate,
                dto.MealType,
                dto.BufferCount,
                dto.ExpectedStudents,
                dto.ExpectedStaff,
                dto.MenuItems,
                User.FindFirstValue(ClaimTypes.Name));

            return Ok(plans);
        }
    }
}
