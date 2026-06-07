using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MessManagement.Api.Services;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")] // Only Admin and Staff can access Inventory
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public InventoryController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventory()
        {
            var inventory = await _context.InventoryItems.Include(i => i.Vendor).ToListAsync();
            return Ok(inventory);
        }

        [HttpPost]
        public async Task<IActionResult> AddInventory([FromBody] InventoryItemDto dto)
        {
            if (dto.Quantity < 0 || dto.MinimumStock < 0 || dto.SafetyStock < 0 || dto.PurchasePrice < 0)
            {
                return BadRequest("Quantity, minimum stock, safety stock, and purchase price cannot be negative.");
            }

            var user = await GetCurrentUser();

            var item = new InventoryItem
            {
                ItemName = dto.ItemName,
                Category = dto.Category,
                Quantity = dto.Quantity,
                Unit = dto.Unit,
                MinimumStock = dto.MinimumStock,
                SafetyStock = dto.SafetyStock,
                PurchasePrice = dto.PurchasePrice,
                VendorId = dto.VendorId,
                ExpiryDate = dto.ExpiryDate,
                IsPerishable = dto.IsPerishable,
                AlertWhenLowStock = dto.AlertWhenLowStock,
                UseInMealPlanning = dto.UseInMealPlanning,
                Status = dto.IsActive ? "Active" : "Inactive",
                CreatedBy = user?.FullName
            };

            item.StockStatus = item.Quantity <= item.MinimumStock ? (item.Quantity == 0 ? "Out of Stock" : "Low Stock") : "In Stock";

            _context.InventoryItems.Add(item);
            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] InventoryItemDto dto)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null) return NotFound("Item not found");
            if (dto.Quantity < 0 || dto.MinimumStock < 0 || dto.SafetyStock < 0 || dto.PurchasePrice < 0)
            {
                return BadRequest("Quantity, minimum stock, safety stock, and purchase price cannot be negative.");
            }

            item.ItemName = dto.ItemName;
            item.Category = dto.Category;
            item.Quantity = dto.Quantity;
            item.Unit = dto.Unit;
            item.MinimumStock = dto.MinimumStock;
            item.SafetyStock = dto.SafetyStock;
            item.PurchasePrice = dto.PurchasePrice;
            item.VendorId = dto.VendorId;
            item.ExpiryDate = dto.ExpiryDate;
            item.IsPerishable = dto.IsPerishable;
            item.AlertWhenLowStock = dto.AlertWhenLowStock;
            item.UseInMealPlanning = dto.UseInMealPlanning;
            item.Status = dto.IsActive ? "Active" : "Inactive";
            item.LastUpdated = DateTime.UtcNow;

            item.StockStatus = item.Quantity <= item.MinimumStock ? (item.Quantity == 0 ? "Out of Stock" : "Low Stock") : "In Stock";

            await _context.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null) return NotFound("Item not found");

            _context.InventoryItems.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Item deleted successfully" });
        }

        [HttpPost("{id}/stock-in")]
        public async Task<IActionResult> StockIn(int id, [FromBody] StockTransactionDto dto)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null) return NotFound("Item not found");
            if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");

            item.Quantity += dto.Quantity;
            item.LastUpdated = DateTime.UtcNow;
            item.StockStatus = GetStockStatus(item.Quantity, item.MinimumStock);

            var user = await GetCurrentUser();

            var transaction = new InventoryTransaction
            {
                InventoryId = id,
                Type = "Stock In",
                Quantity = dto.Quantity,
                Remarks = dto.Remarks,
                CreatedBy = user?.FullName
            };

            _context.InventoryTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(item);
        }

        [HttpPost("{id}/stock-out")]
        public async Task<IActionResult> StockOut(int id, [FromBody] StockTransactionDto dto)
        {
            var item = await _context.InventoryItems.FindAsync(id);
            if (item == null) return NotFound("Item not found");
            if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");

            if (item.Quantity < dto.Quantity) return BadRequest("Insufficient stock");

            item.Quantity -= dto.Quantity;
            item.LastUpdated = DateTime.UtcNow;
            item.StockStatus = GetStockStatus(item.Quantity, item.MinimumStock);

            var user = await GetCurrentUser();

            var transaction = new InventoryTransaction
            {
                InventoryId = id,
                Type = "Stock Out",
                Quantity = dto.Quantity,
                Remarks = dto.Remarks,
                CreatedBy = user?.FullName
            };

            _context.InventoryTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(item);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            var transactions = await _context.InventoryTransactions
                .Include(t => t.InventoryItem)
                .OrderByDescending(t => t.Date)
                .ToListAsync();
            return Ok(transactions);
        }

        [HttpGet("check-requirement")]
        public async Task<IActionResult> CheckRequirement([FromQuery] DateTime date)
        {
            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(
                date == default ? DateTime.UtcNow.Date : date.Date,
                persistPlans: true);

            return Ok(rows);
        }

        [HttpGet("check")]
        public async Task<IActionResult> CheckInventoryStock([FromQuery] DateTime date)
        {
            var targetDate = date == default ? DateTime.UtcNow.Date : date.Date;
            var rows = await _workflow.BuildMealPlanningRowsFromMenuAsync(targetDate, persistPlans: false);

            var checkResult = rows.Select(r => {
                dynamic dr = r;
                return new {
                    ingredientName = dr.ingredientName,
                    requiredQuantity = dr.requiredQuantity,
                    availableStock = dr.availableQuantity,
                    shortageQuantity = dr.shortageQuantity,
                    unit = dr.unit,
                    stockStatus = dr.stockStatus
                };
            });

            return Ok(checkResult);
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
