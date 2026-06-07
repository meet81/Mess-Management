using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using MessManagement.Api.Data;
using MessManagement.Api.DTOs;
using MessManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalaryAdvanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalaryAdvanceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/salary-advance
        [HttpGet]
        public async Task<IActionResult> GetSalaryAdvance()
        {
            var isStaff = User.IsInRole("Staff");
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            var query = _context.SalaryAdvances
                .Include(a => a.User)
                .AsQueryable();

            if (isStaff)
            {
                query = query.Where(a => a.UserId == userId);
            }

            var results = await query
                .Select(a => new
                {
                    a.AdvanceId,
                    a.UserId,
                    StaffName = a.User != null ? a.User.FullName : "Unknown",
                    a.AdvanceAmount,
                    a.RecoveryAmount,
                    a.RemainingAmount,
                    a.ApprovalStatus,
                    a.CreatedAt
                })
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(results);
        }

        // POST: api/salary-advance
        [HttpPost]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> CreateSalaryAdvance([FromBody] SalaryAdvanceCreateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            if (dto.AdvanceAmount <= 0)
                return BadRequest("Advance amount must be greater than zero.");

            if (dto.RecoveryAmount <= 0 || dto.RecoveryAmount > dto.AdvanceAmount)
                return BadRequest("Recovery amount must be greater than zero and cannot exceed total advance amount.");

            var record = new SalaryAdvance
            {
                UserId = userId,
                AdvanceAmount = dto.AdvanceAmount,
                RecoveryAmount = dto.RecoveryAmount,
                RemainingAmount = dto.AdvanceAmount,
                ApprovalStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.SalaryAdvances.Add(record);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Salary advance request submitted successfully.", record.AdvanceId });
        }

        // PUT: api/salary-advance/approve/{id}
        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveSalaryAdvance(int id, [FromBody] SalaryAdvanceApproveDto dto)
        {
            var record = await _context.SalaryAdvances.FindAsync(id);
            if (record == null) return NotFound("Salary advance request not found.");

            if (record.ApprovalStatus != "Pending")
                return BadRequest("Salary advance request has already been reviewed.");

            record.ApprovalStatus = dto.Status == "Approved" ? "Approved" : "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Salary advance request has been {record.ApprovalStatus.ToLower()} successfully.", status = record.ApprovalStatus });
        }
    }
}
