using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")] // Only Admin and Staff can manage vendors
    public class VendorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetVendors()
        {
            var vendors = await _context.Vendors.ToListAsync();
            return Ok(vendors);
        }

        [HttpPost]
        public async Task<IActionResult> AddVendor([FromBody] VendorDto dto)
        {
            var vendor = new Vendor
            {
                VendorName = dto.VendorName,
                ContactPerson = dto.ContactPerson,
                MobileNumber = dto.MobileNumber,
                Email = dto.Email,
                Address = dto.Address,
                SuppliedItems = dto.SuppliedItems
            };

            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();
            return Ok(vendor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVendor(int id, [FromBody] VendorDto dto)
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound("Vendor not found.");

            vendor.VendorName = dto.VendorName;
            vendor.ContactPerson = dto.ContactPerson;
            vendor.MobileNumber = dto.MobileNumber;
            vendor.Email = dto.Email;
            vendor.Address = dto.Address;
            vendor.SuppliedItems = dto.SuppliedItems;

            await _context.SaveChangesAsync();
            return Ok(vendor);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVendor(int id)
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound("Vendor not found.");

            // Optionally check if vendor is referenced in InventoryItems or VendorOrders
            var isInUse = await _context.InventoryItems.AnyAsync(i => i.VendorId == id) || 
                          await _context.VendorOrders.AnyAsync(o => o.VendorId == id);
            
            if (isInUse)
            {
                return BadRequest(new { message = "Cannot delete this vendor because they are linked to existing inventory items or orders." });
            }

            _context.Vendors.Remove(vendor);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Vendor deleted successfully." });
        }
    }
}
