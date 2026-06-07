using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessManagement.Api.Data;
using MessManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous] // Allow running without login
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeedController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("generate-data")]
        public async Task<IActionResult> GenerateData()
        {
            // 1. CLEAR EXISTING DATA (To avoid conflicts/duplicates)
            _context.StaffSalaries.RemoveRange(_context.StaffSalaries);
            _context.Payments.RemoveRange(_context.Payments);
            _context.Leaves.RemoveRange(_context.Leaves);
            _context.Attendances.RemoveRange(_context.Attendances);
            _context.Feedbacks.RemoveRange(_context.Feedbacks);
            _context.Menus.RemoveRange(_context.Menus);
            _context.Users.RemoveRange(_context.Users);
            await _context.SaveChangesAsync();

            var random = new Random();
            int targetYear = 2024; // Use 2024 (Leap year) for Jan, Feb, March simulation

            // 2. GENERATE USERS
            var users = new List<User>();
            string defaultPassword = BCrypt.Net.BCrypt.HashPassword("password123");

            users.Add(new User { FullName = "Admin User", Email = "admin@mess.com", Role = "Admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123") });

            for (int i = 1; i <= 5; i++)
                users.Add(new User { FullName = $"Staff Member {i}", Email = $"staff{i}@mess.com", Role = "Staff", PasswordHash = defaultPassword });

            for (int i = 1; i <= 15; i++)
                users.Add(new User { FullName = $"Student {i}", Email = $"student{i}@mess.com", Role = "Student", PasswordHash = defaultPassword });

            _context.Users.AddRange(users);
            await _context.SaveChangesAsync();

            var students = await _context.Users.Where(u => u.Role == "Student").ToListAsync();
            var staff = await _context.Users.Where(u => u.Role == "Staff").ToListAsync();

            // 3. GENERATE MENUS
            var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
            var menus = days.Select(d => new Menu
            {
                DayOfWeek = d,
                Breakfast = $"{d} Special Poha, Tea, Toast",
                Lunch = "Dal Tadka, Steamed Rice, Roti, Seasonal Sabji",
                Dinner = "Paneer Butter Masala, Roti, Jeera Rice, Gulab Jamun"
            }).ToList();
            _context.Menus.AddRange(menus);

            // 4. GENERATE LEAVES
            var leaves = new List<Leave>();
            foreach (var student in students)
            {
                int leaveCount = random.Next(1, 3); // 1 to 2 leaves per student over 3 months
                for (int i = 0; i < leaveCount; i++)
                {
                    int month = random.Next(1, 4); // Jan, Feb, Mar
                    int startDay = random.Next(1, 20);
                    int duration = random.Next(2, 6); // 2 to 5 days
                    var startDate = new DateTime(targetYear, month, startDay);
                    
                    leaves.Add(new Leave
                    {
                        UserId = student.Id,
                        StartDate = startDate,
                        EndDate = startDate.AddDays(duration),
                        Reason = "Visiting hometown / Personal emergency",
                        Status = "Approved",
                        BreakfastLeave = true,
                        LunchLeave = true,
                        DinnerLeave = true
                    });
                }
            }
            _context.Leaves.AddRange(leaves);
            await _context.SaveChangesAsync();

            // 5. GENERATE ATTENDANCE (Jan 1 to Mar 31)
            var attendances = new List<Attendance>();
            var startDateIter = new DateTime(targetYear, 1, 1);
            var endDateIter = new DateTime(targetYear, 3, 31);
            string[] meals = { "Breakfast", "Lunch", "Dinner" };

            for (var date = startDateIter; date <= endDateIter; date = date.AddDays(1))
            {
                // Staff (Assume 1 overall record per day represented by Lunch)
                foreach (var st in staff)
                {
                    bool isPresent = random.NextDouble() <= 0.90; // 90% present
                    attendances.Add(new Attendance { UserId = st.Id, Date = date, MealType = "Lunch", Status = isPresent ? "Present" : "Absent" });
                }

                // Students
                foreach (var student in students)
                {
                    bool onLeave = leaves.Any(l => l.UserId == student.Id && date >= l.StartDate && date <= l.EndDate);
                    
                    foreach (var meal in meals)
                    {
                        if (onLeave) continue; // No attendance record if on leave
                        
                        bool isPresent = random.NextDouble() <= 0.85; // 85% present rate naturally
                        attendances.Add(new Attendance { UserId = student.Id, Date = date, MealType = meal, Status = isPresent ? "Present" : "Absent" });
                    }
                }
            }
            _context.Attendances.AddRange(attendances);
            await _context.SaveChangesAsync();

            // 6. GENERATE PAYMENTS (BILLS) & STAFF SALARIES
            var payments = new List<Payment>();
            var salaries = new List<StaffSalary>();

            for (int m = 1; m <= 3; m++)
            {
                int daysInMonth = DateTime.DaysInMonth(targetYear, m);

                // Generate Bills for Students
                foreach (var student in students)
                {
                    int bCount = attendances.Count(a => a.UserId == student.Id && a.Date.Month == m && a.MealType == "Breakfast" && a.Status == "Present");
                    int lCount = attendances.Count(a => a.UserId == student.Id && a.Date.Month == m && a.MealType == "Lunch" && a.Status == "Present");
                    int dCount = attendances.Count(a => a.UserId == student.Id && a.Date.Month == m && a.MealType == "Dinner" && a.Status == "Present");

                    decimal totalAmount = (bCount * 30) + (lCount * 60) + (dCount * 50);
                    
                    int statusRoll = random.Next(100);
                    string status = statusRoll < 60 ? "Paid" : statusRoll < 85 ? "Partial" : "Pending";
                    decimal paidAmount = status == "Paid" ? totalAmount : status == "Partial" ? Math.Round(totalAmount / 2) : 0;

                    if (totalAmount == 0)
                    {
                        status = "Paid";
                        paidAmount = 0;
                    }

                    payments.Add(new Payment {
                        UserId = student.Id, Month = m, Year = targetYear,
                        FromDate = new DateTime(targetYear, m, 1), ToDate = new DateTime(targetYear, m, daysInMonth),
                        BreakfastCount = bCount, LunchCount = lCount, DinnerCount = dCount,
                        TotalAmount = totalAmount, PaidAmount = paidAmount, RemainingAmount = totalAmount - paidAmount,
                        Status = status, PaymentMethod = status == "Pending" ? null : "UPI",
                        TransactionId = status == "Pending" ? null : $"UPI-{random.Next(100000000, 999999999)}"
                    });
                }

                // Generate Salary for Staff
                foreach (var st in staff)
                {
                    int presentDays = attendances.Count(a => a.UserId == st.Id && a.Date.Month == m && a.Status == "Present");
                    decimal totalSalary = presentDays * 500;
                    string status = random.Next(100) < 80 ? "Paid" : "Pending"; // 80% chance paid

                    salaries.Add(new StaffSalary { UserId = st.Id, Month = m, Year = targetYear, TotalWorkingDays = daysInMonth, PresentDays = presentDays, AbsentDays = daysInMonth - presentDays, PerDaySalary = 500, Bonus = 0, Deductions = 0, TotalSalary = totalSalary, PaidAmount = status == "Paid" ? totalSalary : 0, RemainingAmount = status == "Paid" ? 0 : totalSalary, Status = status, PaymentMethod = status == "Paid" ? "Bank Transfer" : null });
                }
            }

            _context.Payments.AddRange(payments);
            _context.StaffSalaries.AddRange(salaries);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Successfully Seeded: 21 Users, 7 Menus, ~35 Leaves, ~4500 Attendances, 45 Payments, 15 Salaries." });
        }
    }
}