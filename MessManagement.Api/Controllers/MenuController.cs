using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MessManagement.Api.Services;
using System.Security.Claims;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requires valid JWT for any action
    public class MenuController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public MenuController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenu([FromQuery] DateTime? date = null)
        {
            // Anyone authed can see the menu
            if (date.HasValue)
            {
                var dayMenu = await _context.Menus.FirstOrDefaultAsync(m => m.DayOfWeek == date.Value.DayOfWeek.ToString());
                if (dayMenu == null) return NotFound("Menu not configured for this date.");

                return Ok(new
                {
                    date = date.Value.Date,
                    dayOfWeek = date.Value.DayOfWeek.ToString(),
                    menu = dayMenu
                });
            }

            var menu = await _context.Menus.ToListAsync();
            return Ok(menu);
        }

        [HttpGet("day-wise")]
        public async Task<IActionResult> GetDayWiseMenu()
        {
            var menu = await _context.Menus
                .OrderBy(m => m.Id)
                .Select(m => new
                {
                    m.Id,
                    m.DayOfWeek,
                    m.Breakfast,
                    m.Lunch,
                    m.Dinner,
                    m.LastUpdated
                })
                .ToListAsync();

            return Ok(menu);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")] // Only Admins can add
        public async Task<IActionResult> AddMenu([FromBody] MenuDto dto)
        {
            var menu = new Menu
            {
                DayOfWeek = dto.DayOfWeek,
                Breakfast = dto.Breakfast,
                Lunch = dto.Lunch,
                Dinner = dto.Dinner,
                LastUpdated = DateTime.UtcNow
            };

            _context.Menus.Add(menu);
            await _context.SaveChangesAsync();
            await _workflow.RecalculateMenuWeekAsync(menu.DayOfWeek, User.FindFirstValue(ClaimTypes.Name));

            return Ok(menu);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMenu(int id, [FromBody] MenuDto dto)
        {
            var menu = await _context.Menus.FindAsync(id);
            if (menu == null) return NotFound("Menu item not found");

            menu.DayOfWeek = dto.DayOfWeek;
            menu.Breakfast = dto.Breakfast;
            menu.Lunch = dto.Lunch;
            menu.Dinner = dto.Dinner;
            menu.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _workflow.RecalculateMenuWeekAsync(menu.DayOfWeek, User.FindFirstValue(ClaimTypes.Name));

            return Ok(menu);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMenu(int id)
        {
            var menu = await _context.Menus.FindAsync(id);
            if (menu == null) return NotFound("Menu item not found");

            _context.Menus.Remove(menu);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Menu deleted successfully" });
        }
    }
}
