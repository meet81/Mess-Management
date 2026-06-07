using System;
using System.Collections.Generic;
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
    public class PayrollController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PayrollController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/payroll
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetPayroll([FromQuery] int? month, [FromQuery] int? year, [FromQuery] string? status, [FromQuery] string? department, [FromQuery] int? staffId)
        {
            var isStaff = User.IsInRole("Staff");
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            var query = _context.StaffSalaries
                .Include(s => s.User)
                .AsQueryable();

            if (isStaff)
            {
                query = query.Where(s => s.UserId == userId);
            }
            else
            {
                if (month.HasValue) query = query.Where(s => s.Month == month);
                if (year.HasValue) query = query.Where(s => s.Year == year);
                if (!string.IsNullOrEmpty(status)) query = query.Where(s => s.Status == status);
                if (!string.IsNullOrEmpty(department)) query = query.Where(s => s.User != null && s.User.Department == department);
                if (staffId.HasValue) query = query.Where(s => s.UserId == staffId.Value);
            }

            var results = await query
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    StaffName = s.User != null ? s.User.FullName : "Unknown",
                    Designation = s.User != null ? s.User.Designation : "N/A",
                    Department = s.User != null ? s.User.Department : "N/A",
                    SalaryType = s.User != null ? s.User.SalaryType : "Monthly Salary",
                    EmploymentType = s.User != null ? s.User.EmploymentType : "Permanent",
                    s.Month,
                    s.Year,
                    s.TotalWorkingDays,
                    s.PresentDays,
                    s.AbsentDays,
                    s.LeaveDays,
                    s.BaseSalary,
                    s.DailySalary,
                    s.PerDaySalary,
                    s.OvertimeRate,
                    s.OvertimeHours,
                    s.OvertimeAmount,
                    s.Bonus,
                    s.Incentive,
                    s.FestivalBonus,
                    s.Deductions,
                    s.LeaveDeduction,
                    s.LatePenalty,
                    s.AdvanceRecovery,
                    s.OtherDeductions,
                    s.GrossSalary,
                    s.TotalSalary, // backward compatibility
                    s.NetSalary,
                    s.PaidAmount,
                    s.RemainingAmount,
                    s.Status,
                    s.PaymentMethod,
                    s.TransactionId,
                    s.DatePaid,
                    s.CreatedAt
                })
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.Month)
                .ToListAsync();

            return Ok(results);
        }

        // GET: api/payroll/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetPayrollDetails(int id)
        {
            var isStaff = User.IsInRole("Staff");
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int.TryParse(userIdStr, out int userId);

            var s = await _context.StaffSalaries
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null) return NotFound("Payroll record not found.");

            if (isStaff && s.UserId != userId)
                return Forbid("You do not have access to view this payroll record.");

            var details = new
            {
                s.Id,
                s.UserId,
                StaffName = s.User != null ? s.User.FullName : "Unknown",
                Designation = s.User != null ? s.User.Designation : "N/A",
                Department = s.User != null ? s.User.Department : "N/A",
                SalaryType = s.User != null ? s.User.SalaryType : "Monthly Salary",
                EmploymentType = s.User != null ? s.User.EmploymentType : "Permanent",
                BankAccountDetails = s.User != null ? s.User.BankAccountDetails : "",
                UpiId = s.User != null ? s.User.UpiId : "",
                PanNumber = s.User != null ? s.User.PanNumber : "",
                AadhaarNumber = s.User != null ? s.User.AadhaarNumber : "",
                s.Month,
                s.Year,
                s.TotalWorkingDays,
                s.PresentDays,
                s.AbsentDays,
                s.LeaveDays,
                s.BaseSalary,
                s.DailySalary,
                s.PerDaySalary,
                s.OvertimeRate,
                s.OvertimeHours,
                s.OvertimeAmount,
                s.Bonus,
                s.Incentive,
                s.FestivalBonus,
                s.Deductions,
                s.LeaveDeduction,
                s.LatePenalty,
                s.AdvanceRecovery,
                s.OtherDeductions,
                s.GrossSalary,
                s.TotalSalary,
                s.NetSalary,
                s.PaidAmount,
                s.RemainingAmount,
                s.Status,
                s.PaymentMethod,
                s.TransactionId,
                s.DatePaid,
                s.CreatedAt
            };

            return Ok(details);
        }

        public class ExtendedStaffInput
        {
            public int UserId { get; set; }
            public decimal OvertimeHours { get; set; }
            public decimal Bonus { get; set; }
            public decimal Incentive { get; set; }
            public decimal FestivalBonus { get; set; }
            public decimal LeaveDeduction { get; set; }
            public decimal LatePenalty { get; set; }
            public decimal OtherDeductions { get; set; }
            public int LeaveDays { get; set; }
            public bool AutoRecoverAdvance { get; set; }
        }

        public class GenerateExtendedPayrollRequest
        {
            public int Month { get; set; }
            public int Year { get; set; }
            public List<ExtendedStaffInput>? StaffInputs { get; set; }
        }

        // POST: api/payroll/generate
        [HttpPost("generate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GeneratePayroll([FromBody] GenerateExtendedPayrollRequest request)
        {
            if (request.Month < 1 || request.Month > 12)
                return BadRequest("Invalid month");

            var year = request.Year <= 0 ? DateTime.UtcNow.Year : request.Year;
            var daysInMonth = DateTime.DaysInMonth(year, request.Month);

            var staffUsers = await _context.Users
                .Where(u => u.Role == "Staff")
                .ToListAsync();

            var generatedCount = 0;

            foreach (var staff in staffUsers)
            {
                var input = request.StaffInputs?.FirstOrDefault(i => i.UserId == staff.Id);
                var overtimeHours = input?.OvertimeHours ?? 0;
                var bonus = input?.Bonus ?? 0;
                var incentive = input?.Incentive ?? 0;
                var festivalBonus = input?.FestivalBonus ?? 0;
                
                var leaveDeduction = input?.LeaveDeduction ?? 0;
                var latePenalty = input?.LatePenalty ?? 0;
                var otherDeductions = input?.OtherDeductions ?? 0;
                var leaveDays = input?.LeaveDays ?? 0;

                // 1. Calculate present days based on attendance records
                var presentDays = await _context.Attendances
                    .Where(a => a.UserId == staff.Id
                             && a.Date.Month == request.Month
                             && a.Date.Year == year
                             && a.Status == "Present")
                    .Select(a => a.Date.Date)
                    .Distinct()
                    .CountAsync();

                // 2. Fetch profile variables
                var baseSalary = staff.BaseSalary ?? 15000;
                var dailyWage = staff.DailyWage ?? (baseSalary / daysInMonth);
                var overtimeRate = staff.OvertimeRate ?? 120;

                decimal perDaySalary = dailyWage;
                decimal attendanceSalary = 0;

                if (staff.SalaryType == "Daily Wage")
                {
                    attendanceSalary = dailyWage * presentDays;
                }
                else if (staff.SalaryType == "Hourly Wage")
                {
                    // Assuming standard 8 hour day
                    attendanceSalary = (dailyWage / 8) * 8 * presentDays;
                }
                else // Monthly Salary or Attendance-Based Salary
                {
                    perDaySalary = baseSalary / daysInMonth;
                    attendanceSalary = perDaySalary * presentDays;
                }

                // If admin checked overtime calculation automatically
                var approvedOvertimeHours = await _context.OvertimeRecords
                    .Where(o => o.UserId == staff.Id
                             && o.OvertimeDate.Month == request.Month
                             && o.OvertimeDate.Year == year
                             && o.ApprovalStatus == "Approved")
                    .SumAsync(o => o.OvertimeHours);

                var totalOvertimeHours = overtimeHours > 0 ? overtimeHours : approvedOvertimeHours;
                var overtimeAmount = totalOvertimeHours * overtimeRate;

                // Gross Salary = Attendance Salary + Bonus + Incentive + Festival Bonus + Overtime Amount
                var grossSalary = attendanceSalary + bonus + incentive + festivalBonus + overtimeAmount;

                // Advance Recovery Auto Calculation
                decimal advanceRecovery = 0;
                if (input == null || input.AutoRecoverAdvance)
                {
                    // Fetch outstanding active advances
                    var activeAdvances = await _context.SalaryAdvances
                        .Where(a => a.UserId == staff.Id && a.ApprovalStatus == "Approved" && a.RemainingAmount > 0)
                        .ToListAsync();

                    foreach (var adv in activeAdvances)
                    {
                        var maxRecoveryForThisAdv = Math.Min(adv.RecoveryAmount, adv.RemainingAmount);
                        advanceRecovery += maxRecoveryForThisAdv;
                    }
                }

                // Total Deduction = Leave Deduction + Late Penalty + Advance Recovery + Other Deductions
                var totalDeductions = leaveDeduction + latePenalty + advanceRecovery + otherDeductions;

                // Net Salary = Gross Salary - Total Deduction
                var netSalary = Math.Max(0, grossSalary - totalDeductions);

                var existing = await _context.StaffSalaries
                    .FirstOrDefaultAsync(s => s.UserId == staff.Id
                                           && s.Month == request.Month
                                           && s.Year == year);

                if (existing == null)
                {
                    _context.StaffSalaries.Add(new StaffSalary
                    {
                        UserId = staff.Id,
                        Month = request.Month,
                        Year = year,
                        TotalWorkingDays = daysInMonth,
                        PresentDays = presentDays,
                        AbsentDays = daysInMonth - presentDays,
                        LeaveDays = leaveDays,
                        BaseSalary = baseSalary,
                        DailySalary = Math.Round(dailyWage, 2),
                        PerDaySalary = Math.Round(perDaySalary, 2),
                        OvertimeRate = overtimeRate,
                        OvertimeHours = totalOvertimeHours,
                        OvertimeAmount = Math.Round(overtimeAmount, 2),
                        Bonus = bonus,
                        Incentive = incentive,
                        FestivalBonus = festivalBonus,
                        LeaveDeduction = leaveDeduction,
                        LatePenalty = latePenalty,
                        AdvanceRecovery = Math.Round(advanceRecovery, 2),
                        OtherDeductions = otherDeductions,
                        Deductions = Math.Round(totalDeductions, 2),
                        GrossSalary = Math.Round(grossSalary, 2),
                        TotalSalary = Math.Round(netSalary, 2), // backwards compatibility total/net
                        NetSalary = Math.Round(netSalary, 2),
                        PaidAmount = 0,
                        RemainingAmount = Math.Round(netSalary, 2),
                        Status = "Draft",
                        CreatedAt = DateTime.UtcNow
                    });
                }
                else if (existing.Status == "Draft" || existing.Status == "Pending Approval" || existing.Status == "Pending" || existing.Status == "Rejected")
                {
                    existing.TotalWorkingDays = daysInMonth;
                    existing.PresentDays = presentDays;
                    existing.AbsentDays = daysInMonth - presentDays;
                    existing.LeaveDays = leaveDays;
                    existing.BaseSalary = baseSalary;
                    existing.DailySalary = Math.Round(dailyWage, 2);
                    existing.PerDaySalary = Math.Round(perDaySalary, 2);
                    existing.OvertimeRate = overtimeRate;
                    existing.OvertimeHours = totalOvertimeHours;
                    existing.OvertimeAmount = Math.Round(overtimeAmount, 2);
                    existing.Bonus = bonus;
                    existing.Incentive = incentive;
                    existing.FestivalBonus = festivalBonus;
                    existing.LeaveDeduction = leaveDeduction;
                    existing.LatePenalty = latePenalty;
                    existing.AdvanceRecovery = Math.Round(advanceRecovery, 2);
                    existing.OtherDeductions = otherDeductions;
                    existing.Deductions = Math.Round(totalDeductions, 2);
                    existing.GrossSalary = Math.Round(grossSalary, 2);
                    existing.TotalSalary = Math.Round(netSalary, 2);
                    existing.NetSalary = Math.Round(netSalary, 2);
                    existing.RemainingAmount = Math.Round(netSalary - existing.PaidAmount, 2);
                    
                    if (existing.Status == "Rejected" || existing.Status == "Pending")
                    {
                        existing.Status = "Draft";
                    }
                }

                generatedCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Recalculated and generated drafted payroll sheets for {generatedCount} staff." });
        }

        // PUT: api/payroll/approve/{id}
        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApprovePayroll(int id)
        {
            var salary = await _context.StaffSalaries.FindAsync(id);
            if (salary == null) return NotFound("Salary statement not found.");

            if (salary.Status != "Draft" && salary.Status != "Pending Approval" && salary.Status != "Pending" && salary.Status != "Rejected")
                return BadRequest("Salary sheet is already approved, cancelled, or paid.");

            salary.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Salary statement approved successfully.", status = salary.Status });
        }

        // PUT: api/payroll/pay/{id}
        [HttpPut("pay/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PayPayroll(int id, [FromBody] PayrollPayDto dto)
        {
            var salary = await _context.StaffSalaries.FindAsync(id);
            if (salary == null) return NotFound("Salary record not found");

            if (dto.Amount <= 0)
                return BadRequest("Amount must be positive");

            if (salary.RemainingAmount < dto.Amount)
                return BadRequest("Payout amount exceeds outstanding due balance");

            // Complete Payment
            salary.PaidAmount += dto.Amount;
            salary.RemainingAmount -= dto.Amount;
            salary.PaymentMethod = dto.PaymentMethod;
            salary.TransactionId = dto.TransactionId;
            salary.DatePaid = DateTime.UtcNow;

            salary.Status = salary.RemainingAmount <= 0 ? "Paid" : "Partial";

            // If salary is fully or partially paid, recover the outstanding advances
            if (salary.Status == "Paid" || salary.Status == "Partial")
            {
                var activeAdvances = await _context.SalaryAdvances
                    .Where(a => a.UserId == salary.UserId && a.ApprovalStatus == "Approved" && a.RemainingAmount > 0)
                    .ToListAsync();

                decimal totalDeductedSoFar = 0;
                foreach (var adv in activeAdvances)
                {
                    if (totalDeductedSoFar >= salary.AdvanceRecovery) break;

                    var recoveryNeeded = Math.Min(adv.RecoveryAmount, adv.RemainingAmount);
                    var chunk = Math.Min(recoveryNeeded, salary.AdvanceRecovery - totalDeductedSoFar);

                    adv.RemainingAmount -= chunk;
                    totalDeductedSoFar += chunk;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment recorded and advance recovers balanced.", status = salary.Status, remaining = salary.RemainingAmount });
        }

        // GET: api/payroll/report
        [HttpGet("report")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPayrollReport([FromQuery] int month, [FromQuery] int year)
        {
            return await GetPayrollReports(month, year);
        }

        // GET: api/payroll/reports
        [HttpGet("reports")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPayrollReports([FromQuery] int month, [FromQuery] int year)
        {
            var salaries = await _context.StaffSalaries
                .Include(s => s.User)
                .Where(s => s.Month == month && s.Year == year)
                .ToListAsync();

            if (!salaries.Any())
            {
                return Ok(new
                {
                    totalGenerated = 0,
                    totalPaid = 0,
                    totalRemaining = 0,
                    overtimeCost = 0,
                    departmentSummary = new List<object>(),
                    designationSummary = new List<object>(),
                    pendingPayments = new List<object>()
                });
            }

            var totalGenerated = salaries.Sum(s => s.NetSalary);
            var totalPaid = salaries.Sum(s => s.PaidAmount);
            var totalRemaining = salaries.Sum(s => s.RemainingAmount);
            var overtimeCost = salaries.Sum(s => s.OvertimeAmount);

            var designationSummary = salaries
                .GroupBy(s => s.User?.Designation ?? "Unknown")
                .Select(g => new
                {
                    Designation = g.Key,
                    Count = g.Count(),
                    TotalSalary = g.Sum(s => s.NetSalary),
                    Paid = g.Sum(s => s.PaidAmount),
                    Remaining = g.Sum(s => s.RemainingAmount)
                })
                .ToList();

            var departmentSummary = salaries
                .GroupBy(s => s.User?.Department ?? "Unknown")
                .Select(g => new
                {
                    Department = g.Key,
                    Count = g.Count(),
                    TotalSalary = g.Sum(s => s.NetSalary),
                    Paid = g.Sum(s => s.PaidAmount),
                    Remaining = g.Sum(s => s.RemainingAmount)
                })
                .ToList();

            var pendingPayments = salaries
                .Where(s => s.RemainingAmount > 0)
                .Select(s => new
                {
                    s.Id,
                    s.UserId,
                    StaffName = s.User?.FullName ?? "Unknown",
                    TotalSalary = s.NetSalary,
                    s.PaidAmount,
                    s.RemainingAmount,
                    s.Status
                })
                .ToList();

            return Ok(new
            {
                totalGenerated,
                totalPaid,
                totalRemaining,
                overtimeCost,
                departmentSummary,
                designationSummary,
                pendingPayments
            });
        }
    }
}
