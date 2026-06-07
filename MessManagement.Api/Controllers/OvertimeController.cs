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
    public class OvertimeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OvertimeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/overtime
        [HttpGet]
        public async Task<IActionResult> GetOvertime()
        {
            var isStaff = User.IsInRole("Staff");
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            var query = _context.OvertimeRecords
                .Include(o => o.User)
                .AsQueryable();

            if (isStaff)
            {
                query = query.Where(o => o.UserId == userId);
            }

            var results = await query
                .Select(o => new
                {
                    o.OvertimeId,
                    o.UserId,
                    StaffName = o.User != null ? o.User.FullName : "Unknown",
                    o.OvertimeHours,
                    o.OvertimeDate,
                    o.OvertimeRate,
                    o.ApprovedBy,
                    o.ApprovalStatus,
                    o.CreatedAt
                })
                .OrderByDescending(o => o.OvertimeDate)
                .ToListAsync();

            return Ok(results);
        }

        // POST: api/overtime
        [HttpPost]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> CreateOvertime([FromBody] OvertimeRecordCreateDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User profile not found.");

            if (dto.OvertimeHours <= 0)
                return BadRequest("Overtime hours must be greater than zero.");

            var record = new OvertimeRecord
                {
                    UserId = userId,
                    OvertimeHours = dto.OvertimeHours,
                    OvertimeDate = dto.OvertimeDate == default ? DateTime.UtcNow.Date : dto.OvertimeDate.Date,
                    OvertimeRate = user.OvertimeRate ?? 120, // default rate if profile is missing
                    ApprovalStatus = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

            _context.OvertimeRecords.Add(record);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Overtime hours submitted successfully.", record.OvertimeId });
        }

        // PUT: api/overtime/approve/{id}
        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveOvertime(int id, [FromBody] OvertimeApproveDto dto)
        {
            var record = await _context.OvertimeRecords.FindAsync(id);
            if (record == null) return NotFound("Overtime record not found.");

            if (record.ApprovalStatus != "Pending")
                return BadRequest("Overtime record has already been reviewed.");

            var adminName = User.FindFirst("FullName")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Admin";

            record.ApprovalStatus = dto.Status == "Approved" ? "Approved" : "Rejected";
            record.ApprovedBy = adminName;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Overtime record has been {record.ApprovalStatus.ToLower()} successfully.", status = record.ApprovalStatus });
        }
    }
}
