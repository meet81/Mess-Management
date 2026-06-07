using MessManagement.Api.DTOs;
using MessManagement.Api.Services;
using MessManagement.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MessManagement.Api.Controllers
{
    [Route("api/meal-planning")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class MealPlanningIntegrationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public MealPlanningIntegrationController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet("plans")]
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

        [HttpGet("from-menu")]
        public async Task<IActionResult> GetFromMenu([FromQuery] DateTime date)
        {
            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(
                date == default ? DateTime.UtcNow.Date : date.Date,
                User.FindFirstValue(ClaimTypes.Name),
                persistPlans: true);

            return Ok(rows);
        }

        [HttpGet("expected-headcount")]
        public async Task<IActionResult> GetExpectedHeadcount([FromQuery] DateTime date, [FromQuery] string mealType)
        {
            var targetDate = date == default ? DateTime.UtcNow.Date : date.Date;
            var expected = await _workflow.GetExpectedMealCount(targetDate, mealType, 0, null, null);
            var totalStudentCount = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalStaffCount = await _context.Users.CountAsync(u => u.Role == "Staff");
            return Ok(new
            {
                expectedStudents = expected.ExpectedStudents,
                expectedStaff = expected.ExpectedStaff,
                approvedLeaves = expected.ApprovedLeaves,
                staffAttendance = expected.StaffAttendance,
                attendanceTrend = expected.AttendanceTrend,
                totalExpected = expected.TotalExpectedCount,
                totalStudents = totalStudentCount,
                totalStaff = totalStaffCount
            });
        }

        [HttpPost("calculate")]
        public async Task<IActionResult> Calculate([FromBody] MealPlanCalculateDto dto)
        {
            var mealTypes = string.IsNullOrWhiteSpace(dto.MealType)
                ? new[] { "Breakfast", "Lunch", "Dinner" }
                : new[] { dto.MealType };

            foreach (var mealType in mealTypes)
            {
                await _workflow.RecalculateMealPlanAsync(
                    dto.PlanDate == default ? DateTime.UtcNow.Date : dto.PlanDate.Date,
                    mealType,
                    dto.BufferCount,
                    dto.ExpectedStudents,
                    dto.ExpectedStaff,
                    dto.MenuItems,
                    User.FindFirstValue(ClaimTypes.Name));
            }

            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(
                dto.PlanDate == default ? DateTime.UtcNow.Date : dto.PlanDate.Date,
                User.FindFirstValue(ClaimTypes.Name),
                persistPlans: false);

            return Ok(rows);
        }

        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyMealPlanning([FromQuery] DateTime date)
        {
            var targetDate = date == default ? DateTime.UtcNow.Date : date.Date;
            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(targetDate, User.FindFirstValue(ClaimTypes.Name), persistPlans: true);
            return Ok(rows);
        }
    }
}
