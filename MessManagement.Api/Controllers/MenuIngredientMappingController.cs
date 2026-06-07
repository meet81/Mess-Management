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
    [Route("api/menu-ingredient-mapping")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class MenuIngredientMappingController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public MenuIngredientMappingController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetMappings()
        {
            var mappings = await _context.MenuIngredientMappings
                .Include(m => m.Ingredient)
                .OrderBy(m => m.MenuItem)
                .ThenBy(m => m.IngredientName)
                .ToListAsync();

            return Ok(mappings);
        }

        [HttpPost]
        public async Task<IActionResult> AddMapping([FromBody] MenuIngredientMappingDto dto)
        {
            var item = await _context.InventoryItems.FindAsync(dto.IngredientId);
            if (item == null) return BadRequest("Ingredient was not found.");
            if (dto.QuantityPerPerson <= 0) return BadRequest("Quantity per person must be greater than zero.");

            var mapping = new MenuIngredientMapping
            {
                MenuItemId = dto.MenuItemId,
                MenuItem = dto.MenuItem.Trim(),
                MenuItemName = dto.MenuItemName ?? dto.MenuItem.Trim(),
                IngredientId = item.InventoryId,
                IngredientName = item.ItemName,
                QuantityPerPerson = dto.QuantityPerPerson,
                Unit = dto.Unit ?? item.Unit,
                IsRequired = dto.IsRequired,
                MealType = dto.MealType,
                IsOptional = dto.IsOptional,
                Status = dto.Status ?? "Active"
            };

            _context.MenuIngredientMappings.Add(mapping);
            await _context.SaveChangesAsync();
            await RecalculateAffectedMenus(mapping.MenuItem);

            return Ok(mapping);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMapping(int id, [FromBody] MenuIngredientMappingDto dto)
        {
            var mapping = await _context.MenuIngredientMappings.FindAsync(id);
            if (mapping == null) return NotFound("Mapping not found.");

            var item = await _context.InventoryItems.FindAsync(dto.IngredientId);
            if (item == null) return BadRequest("Ingredient was not found.");
            if (dto.QuantityPerPerson <= 0) return BadRequest("Quantity per person must be greater than zero.");

            var oldMenuItem = mapping.MenuItem;
            mapping.MenuItemId = dto.MenuItemId;
            mapping.MenuItem = dto.MenuItem.Trim();
            mapping.MenuItemName = dto.MenuItemName ?? dto.MenuItem.Trim();
            mapping.IngredientId = item.InventoryId;
            mapping.IngredientName = item.ItemName;
            mapping.QuantityPerPerson = dto.QuantityPerPerson;
            mapping.Unit = dto.Unit ?? item.Unit;
            mapping.IsRequired = dto.IsRequired;
            mapping.MealType = dto.MealType;
            mapping.IsOptional = dto.IsOptional;
            mapping.Status = dto.Status ?? "Active";

            await _context.SaveChangesAsync();
            await RecalculateAffectedMenus(oldMenuItem);
            if (!oldMenuItem.Equals(mapping.MenuItem, StringComparison.OrdinalIgnoreCase))
            {
                await RecalculateAffectedMenus(mapping.MenuItem);
            }

            return Ok(mapping);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMapping(int id)
        {
            var mapping = await _context.MenuIngredientMappings.FindAsync(id);
            if (mapping == null) return NotFound("Mapping not found.");

            var menuItem = mapping.MenuItem;
            _context.MenuIngredientMappings.Remove(mapping);
            await _context.SaveChangesAsync();
            await RecalculateAffectedMenus(menuItem);

            return Ok(new { message = "Mapping deleted successfully" });
        }

        private async Task RecalculateAffectedMenus(string menuItem)
        {
            var menus = await _context.Menus
                .Where(m => m.Breakfast.Contains(menuItem) || m.Lunch.Contains(menuItem) || m.Dinner.Contains(menuItem))
                .ToListAsync();
            var createdBy = User.FindFirstValue(ClaimTypes.Name);

            foreach (var menu in menus)
            {
                await _workflow.RecalculateMenuWeekAsync(menu.DayOfWeek, createdBy);
            }
        }
    }
}
