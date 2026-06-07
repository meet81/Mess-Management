using System.Security.Claims;
using MessManagement.Api.Data;
using MessManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SalaryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SalaryController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ ADMIN: GET ALL
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllSalaries(int? month, int? year)
        {
            var query = _context.StaffSalaries
                .Include(s => s.User)
                .AsQueryable();

            if (month.HasValue) query = query.Where(s => s.Month == month);
            if (year.HasValue) query = query.Where(s => s.Year == year);

            var salaries = await query
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    UserName = s.User != null ? s.User.FullName : "N/A",
                    s.Month,
                    s.Year,
                    s.TotalSalary,
                    s.PaidAmount,
                    s.RemainingAmount,
                    s.Status
                })
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.Month)
                .ToListAsync();

            return Ok(salaries);
        }

        // ✅ STAFF: MY SALARY
        [HttpGet("my")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> GetMySalary()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var salaries = await _context.StaffSalaries
                .Include(s => s.User)
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    s.Id,
                    s.Month,
                    s.Year,
                    s.TotalSalary,
                    s.PaidAmount,
                    s.RemainingAmount,
                    s.Status,
                    s.DatePaid
                })
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.Month)
                .ToListAsync();

            return Ok(salaries);
        }

        // DTO
        public class GenerateSalaryDto
        {
            public int Month { get; set; }
            public int Year { get; set; }
            public decimal PerDaySalary { get; set; } = 500;
            public decimal Bonus { get; set; }
            public decimal Deductions { get; set; }
        }

        // ✅ GENERATE SALARY
        [HttpPost("generate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateSalaries([FromBody] GenerateSalaryDto dto)
        {
            if (dto.Month < 1 || dto.Month > 12)
                return BadRequest("Invalid month");

            var staffUsers = await _context.Users
                .Where(u => u.Role == "Staff")
                .ToListAsync();

            int daysInMonth = DateTime.DaysInMonth(dto.Year, dto.Month);
            int generatedCount = 0;

            foreach (var staff in staffUsers)
            {
                var existing = await _context.StaffSalaries
                    .FirstOrDefaultAsync(s => s.UserId == staff.Id
                                           && s.Month == dto.Month
                                           && s.Year == dto.Year);

                var presentDays = await _context.Attendances
                    .Where(a => a.UserId == staff.Id
                             && a.Date.Month == dto.Month
                             && a.Date.Year == dto.Year
                             && a.Status == "Present")
                    .Select(a => a.Date.Date)
                    .Distinct()
                    .CountAsync();

                decimal totalSalary = Math.Max(
                    (presentDays * dto.PerDaySalary) + dto.Bonus - dto.Deductions, 0
                );

                if (existing == null)
                {
                    _context.StaffSalaries.Add(new StaffSalary
                    {
                        UserId = staff.Id,
                        Month = dto.Month,
                        Year = dto.Year,
                        TotalWorkingDays = daysInMonth,
                        PresentDays = presentDays,
                        AbsentDays = daysInMonth - presentDays,
                        PerDaySalary = dto.PerDaySalary,
                        Bonus = dto.Bonus,
                        Deductions = dto.Deductions,
                        TotalSalary = totalSalary,
                        RemainingAmount = totalSalary,
                        Status = "Pending"
                    });
                }
                else if (existing.Status != "Paid")
                {
                    existing.PresentDays = presentDays;
                    existing.AbsentDays = daysInMonth - presentDays;
                    existing.TotalSalary = totalSalary;
                    existing.RemainingAmount = totalSalary - existing.PaidAmount;

                    existing.Status =
                        existing.RemainingAmount <= 0 ? "Paid" :
                        existing.PaidAmount > 0 ? "Partial" : "Pending";
                }

                generatedCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Generated salaries for {generatedCount} staff for {dto.Month}/{dto.Year}"
            });
        }

        // DTO
        public class PaySalaryDto
        {
            public decimal Amount { get; set; }
            public string PaymentMethod { get; set; } = "UPI";
            public string? TransactionId { get; set; }
        }

        // ✅ PAY SALARY
        [HttpPost("pay/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PaySalary(int id, [FromBody] PaySalaryDto dto)
        {
            var salary = await _context.StaffSalaries.FindAsync(id);
            if (salary == null) return NotFound("Salary not found");

            if (dto.Amount <= 0)
                return BadRequest("Invalid amount");

            if (salary.RemainingAmount < dto.Amount)
                return BadRequest("Amount exceeds remaining salary");

            salary.PaidAmount += dto.Amount;
            salary.RemainingAmount -= dto.Amount;

            salary.PaymentMethod = dto.PaymentMethod;
            salary.TransactionId = dto.TransactionId;
            salary.DatePaid = DateTime.UtcNow;

            salary.Status = salary.RemainingAmount <= 0 ? "Paid" : "Partial";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment successful",
                salary.Status,
                salary.RemainingAmount
            });
        }
    }
}