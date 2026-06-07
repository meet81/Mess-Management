using System.Security.Claims;
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
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Attendance
        // Get all attendance records (For Admin/Staff to view on frontend)
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllAttendance()
        {
            var attendanceList = await _context.Attendances
                .Include(a => a.User)
                .Select(a => new {
                    a.Id,
                    a.UserId,
                    UserName = a.User!.FullName,
                    UserRole = a.User.Role,
                    a.Date,
                    a.MealType,
                    a.Status
                })
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return Ok(attendanceList);
        }

        // GET: api/Attendance/my
        // Get attendance for the logged-in student/staff
        [HttpGet("my")]
        public async Task<IActionResult> GetMyAttendance([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var query = _context.Attendances.Where(a => a.UserId == userId);

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.Date.Date >= fromDate.Value.Date);
            }
            if (toDate.HasValue)
            {
                query = query.Where(a => a.Date.Date <= toDate.Value.Date);
            }

            var myAttendance = await query
                .OrderByDescending(a => a.Date)
                .ToListAsync();
            return Ok(myAttendance);
        }

        // GET: api/Attendance/date/{date}
        // Get attendance records for a specific date (For Admin/Staff view)
        [HttpGet("date/{date}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAttendanceByDate(DateTime date)
        {
            var attendanceList = await _context.Attendances
                .Include(a => a.User)
                .Where(a => a.Date.Date == date.Date)
                .Select(a => new {
                    a.Id,
                    a.UserId,
                    UserName = a.User!.FullName,
                    UserRole = a.User.Role,
                    a.Date,
                    a.MealType,
                    a.Status
                })
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return Ok(attendanceList);
        }

        // POST: api/Attendance
        // Manually mark or update a student's attendance
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> MarkAttendance([FromBody] AttendanceDto dto)
        {
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == dto.UserId 
                                       && a.Date.Date == dto.Date.Date 
                                       && a.MealType == dto.MealType);

            if (existingAttendance != null)
            {
                // Update if it already exists for that user, date, and meal
                existingAttendance.Status = dto.Status;
            }
            else
            {
                _context.Attendances.Add(new Attendance {
                    UserId = dto.UserId, Date = dto.Date.Date, MealType = dto.MealType, Status = dto.Status
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Attendance marked successfully" });
        }
    }
}
