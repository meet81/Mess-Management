using System.Security.Claims;
using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LeaveController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveController(AppDbContext context)
        {
            _context = context;
        }

        // Get leaves for the current user (Student/Staff)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyLeaves()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var leaves = await _context.Leaves
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(leaves);
        }

        // Get all leaves (Admin/Staff)
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllLeaves()
        {
            var leaves = await _context.Leaves
                .Include(l => l.User)
                .Select(l => new {
                    l.LeaveId,
                    l.UserId,
                    UserName = l.User!.FullName,
                    UserRole = l.User.Role,
                    l.StartDate,
                    l.EndDate,
                    l.BreakfastLeave,
                    l.LunchLeave,
                    l.DinnerLeave,
                    l.Reason,
                    l.Status
                })
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(leaves);
        }

        // Apply for a leave
        [HttpPost]
        public async Task<IActionResult> RequestLeave([FromBody] LeaveDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            // Admins can create leaves for others, otherwise override UserId
            if (User.IsInRole("Admin") && dto.UserId > 0)
            {
                userId = dto.UserId;
            }

            var leave = new Leave
            {
                UserId = userId,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                BreakfastLeave = dto.BreakfastLeave,
                LunchLeave = dto.LunchLeave,
                DinnerLeave = dto.DinnerLeave,
                Reason = dto.Reason,
                Status = dto.Status // usually "Pending", Admin can set "Approved" directly
            };

            _context.Leaves.Add(leave);
            await _context.SaveChangesAsync();
            return Ok(leave);
        }

        public class UpdateLeaveStatusDto
        {
            public required string Status { get; set; }
        }

        // Approve/Reject leave
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateLeaveStatus(int id, [FromBody] JsonElement body)
        {
            var leave = await _context.Leaves.FindAsync(id);
            if (leave == null) return NotFound();

            string? status = null;
            if (body.ValueKind == JsonValueKind.String)
            {
                status = body.GetString();
            }
            else if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty("status", out var statusProperty))
            {
                status = statusProperty.GetString();
            }
            else if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty("Status", out var statusPascalProperty))
            {
                status = statusPascalProperty.GetString();
            }

            if (status != "Approved" && status != "Rejected" && status != "Pending")
            {
                return BadRequest("Status must be Approved, Rejected, or Pending.");
            }

            leave.Status = status;
            await _context.SaveChangesAsync();
            return Ok(leave);
        }
    }
}
