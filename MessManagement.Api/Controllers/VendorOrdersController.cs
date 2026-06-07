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
    [Route("api/vendor-orders")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class VendorOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SmartKitchenWorkflowService _workflow;

        public VendorOrdersController(AppDbContext context, SmartKitchenWorkflowService workflow)
        {
            _context = context;
            _workflow = workflow;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] bool suggestions = false, [FromQuery] DateTime? date = null)
        {
            if (suggestions)
            {
                return Ok(await _workflow.BuildVendorSuggestionsAsync(date?.Date ?? DateTime.UtcNow.Date.AddDays(1)));
            }

            var orders = await _context.VendorOrders
                .Include(o => o.Vendor)
                .Include(o => o.Ingredient)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            return Ok(orders);
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions([FromQuery] DateTime date)
        {
            var targetDate = date == default ? DateTime.UtcNow.Date.AddDays(1) : date.Date;
            await _workflow.BuildMealPlanningRowsFromMenuAsync(targetDate, User.FindFirstValue(ClaimTypes.Name), persistPlans: true);
            return Ok(await _workflow.BuildVendorSuggestionsAsync(targetDate));
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] VendorOrderDto dto)
        {
            if (dto.Quantity <= 0) return BadRequest("Quantity must be greater than zero.");
            var item = await _context.InventoryItems.Include(i => i.Vendor).FirstOrDefaultAsync(i => i.InventoryId == dto.IngredientId);
            if (item == null) return BadRequest("Ingredient was not found.");

            var vendor = dto.VendorId.HasValue ? await _context.Vendors.FindAsync(dto.VendorId.Value) : item.Vendor;
            var rate = dto.Rate > 0 ? dto.Rate : item.PurchasePrice;
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            var requestedStatus = dto.Status ?? "Draft";
            var status = dto.RequiresAdminApproval && userRole != "Admin" ? "Draft" : requestedStatus;
            var order = new VendorOrder
            {
                VendorId = vendor?.VendorId,
                VendorName = dto.VendorName ?? vendor?.VendorName,
                IngredientId = item.InventoryId,
                IngredientName = dto.IngredientName ?? item.ItemName,
                Quantity = dto.Quantity,
                Unit = dto.Unit ?? item.Unit,
                Rate = rate,
                TotalAmount = dto.Quantity * rate,
                OrderDate = dto.OrderDate?.Date ?? DateTime.UtcNow.Date,
                ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
                Status = status,
                RequiresAdminApproval = dto.RequiresAdminApproval,
                IsAdminApproved = !dto.RequiresAdminApproval || userRole == "Admin",
                CreatedBy = User.FindFirstValue(ClaimTypes.Name)
            };

            _context.VendorOrders.Add(order);
            await _context.SaveChangesAsync();
            return Ok(order);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] VendorOrderStatusDto dto)
        {
            var order = await _context.VendorOrders.FindAsync(id);
            if (order == null) return NotFound("Vendor order not found.");

            var previousStatus = order.Status;
            order.Status = dto.Status;

            if (dto.Status == "Delivered" && previousStatus != "Delivered")
            {
                var item = await _context.InventoryItems.FindAsync(order.IngredientId);
                if (item == null) return BadRequest("Linked inventory item was not found.");

                item.Quantity += order.Quantity;
                item.PurchasePrice = order.Rate;
                item.LastUpdated = DateTime.UtcNow;
                item.StockStatus = item.Quantity <= item.MinimumStock ? "Low Stock" : "In Stock";
                order.DeliveredAt = DateTime.UtcNow;

                _context.InventoryTransactions.Add(new InventoryTransaction
                {
                    InventoryId = item.InventoryId,
                    Type = "Stock In",
                    Quantity = order.Quantity,
                    Remarks = $"Vendor order #{order.VendorOrderId} delivered",
                    CreatedBy = User.FindFirstValue(ClaimTypes.Name)
                });
            }

            await _context.SaveChangesAsync();
            return Ok(order);
        }

        [HttpPut("delivered/{id}")]
        [HttpPut("{id}/delivered")]
        [HttpPut("delivered")]
        public async Task<IActionResult> MarkAsDelivered(int? id, [FromQuery] int? orderId)
        {
            int targetId = id ?? orderId ?? 0;
            if (targetId == 0) return BadRequest("Order ID must be provided.");
            return await UpdateStatus(targetId, new VendorOrderStatusDto { Status = "Delivered" });
        }
    }
}
