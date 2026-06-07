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
    [Route("api/qr-attendance")]
    [ApiController]
    [Authorize]
    public class QrAttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QrAttendanceController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/qr-attendance/scan
        [HttpPost("scan")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ScanQrCode([FromBody] QrScanDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.QrToken))
            {
                return BadRequest(new { success = false, message = "Invalid QR Token" });
            }

            // 1. Extract UserId from token (e.g. USER_QR_CODE:{userId}:{timestamp} or just {userId})
            int userId = 0;
            var parts = dto.QrToken.Split(':');
            if (parts.Length >= 2 && parts[0] == "USER_QR_CODE")
            {
                int.TryParse(parts[1], out userId);
            }
            else
            {
                int.TryParse(dto.QrToken, out userId);
            }

            if (userId <= 0)
            {
                return BadRequest(new { success = false, message = "Invalid QR structure or user ID could not be identified." });
            }

            // 2. Retrieve User
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found in system." });
            }

            // 3. Validate user active status
            if (user.Role == "Staff" && !string.IsNullOrEmpty(user.EmploymentStatus) && user.EmploymentStatus != "Active")
            {
                LogFailedScan(userId, "N/A", dto.QrToken, $"Staff suspended or inactive. Status: {user.EmploymentStatus}", dto.DeviceInfo);
                return BadRequest(new { success = false, message = $"Scan rejected. Staff status is '{user.EmploymentStatus}'." });
            }

            // 4. Fetch System settings for timing and rules
            var settings = await _context.SystemSettings
                .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

            // Determine current meal type based on timings
            var now = DateTime.Now; // Use local time for timing calculations
            var timeOfDay = now.TimeOfDay;
            string? currentMeal = null;

            var meals = new[] { "Breakfast", "Lunch", "Dinner" };
            foreach (var meal in meals)
            {
                settings.TryGetValue($"Meal:{meal}:Start", out var startStr);
                settings.TryGetValue($"Meal:{meal}:End", out var endStr);
                settings.TryGetValue($"Meal:{meal}:Grace", out var graceStr);

                if (TimeSpan.TryParse(startStr, out var startTime) && TimeSpan.TryParse(endStr, out var endTime))
                {
                    int.TryParse(graceStr, out var graceMinutes);
                    var graceEndTime = endTime.Add(TimeSpan.FromMinutes(graceMinutes));

                    settings.TryGetValue("Meal:EnableLateEntry", out var enableLateEntryStr);
                    bool.TryParse(enableLateEntryStr, out var enableLateEntry);

                    var effectiveEndTime = enableLateEntry ? graceEndTime.Add(TimeSpan.FromHours(1)) : graceEndTime;

                    if (timeOfDay >= startTime && timeOfDay <= effectiveEndTime)
                    {
                        currentMeal = meal;
                        break;
                    }
                }
            }

            // Fallback for testing: if no active meal interval, default to "Lunch" or return error depending on timing rules
            settings.TryGetValue("Qr:Enable", out var qrEnabledStr);
            bool.TryParse(qrEnabledStr, out var qrEnabled);
            if (!qrEnabled)
            {
                return BadRequest(new { success = false, message = "QR Attendance is currently disabled in system settings." });
            }

            if (currentMeal == null)
            {
                LogFailedScan(userId, "N/A", dto.QrToken, "Outside of configured meal hours", dto.DeviceInfo);
                return BadRequest(new { success = false, message = $"Outside of meal timing hours. Current time: {now:HH:mm}" });
            }

            // 5. Check Approved Leaves
            var today = DateTime.UtcNow.Date;
            var onLeave = await _context.Leaves
                .AnyAsync(l => l.UserId == userId
                            && l.Status == "Approved"
                            && l.StartDate.Date <= today
                            && l.EndDate.Date >= today
                            && ((currentMeal == "Breakfast" && l.BreakfastLeave) ||
                                (currentMeal == "Lunch" && l.LunchLeave) ||
                                (currentMeal == "Dinner" && l.DinnerLeave)));

            if (onLeave)
            {
                LogFailedScan(userId, currentMeal, dto.QrToken, "User has approved leave for this meal", dto.DeviceInfo);
                return BadRequest(new { success = false, message = $"Scan rejected. User is marked on approved Leave for {currentMeal} today." });
            }

            // 6. Check Duplicate Scan
            var alreadyMarked = await _context.Attendances
                .AnyAsync(a => a.UserId == userId
                            && a.Date.Date == today
                            && a.MealType == currentMeal
                            && a.Status == "Present");

            if (alreadyMarked)
            {
                LogFailedScan(userId, currentMeal, dto.QrToken, "Duplicate scan detected", dto.DeviceInfo);
                return Conflict(new { success = false, message = $"Duplicate Scan: Attendance already recorded for {currentMeal} today." });
            }

            // 7. Mark Attendance (Update or Insert)
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.UserId == userId
                                       && a.Date.Date == today
                                       && a.MealType == currentMeal);

            if (existingAttendance != null)
            {
                existingAttendance.Status = "Present";
            }
            else
            {
                _context.Attendances.Add(new Attendance
                {
                    UserId = userId,
                    Date = today,
                    MealType = currentMeal,
                    Status = "Present"
                });
            }

            // 8. Log Qr Attendance
            var log = new QrAttendance
            {
                UserId = userId,
                MealType = currentMeal,
                AttendanceDate = today,
                AttendanceTime = now.ToString("HH:mm:ss"),
                QrToken = dto.QrToken,
                VerificationStatus = "Verified",
                DeviceInfo = dto.DeviceInfo
            };
            _context.QrAttendances.Add(log);

            // 9. Auto Deduct Ingredients from Inventory if enabled
            settings.TryGetValue("Inventory:AutoDeduction", out var autoDeductStr);
            bool.TryParse(autoDeductStr, out var autoDeduct);
            var deductedItems = new List<string>();

            if (autoDeduct)
            {
                // Fetch today's menu item for the current meal type
                var dayName = today.DayOfWeek.ToString();
                var menu = await _context.Menus.FirstOrDefaultAsync(m => m.DayOfWeek == dayName);
                if (menu != null)
                {
                    var menuText = currentMeal switch
                    {
                        "Breakfast" => menu.Breakfast,
                        "Lunch" => menu.Lunch,
                        "Dinner" => menu.Dinner,
                        _ => null
                    };

                    if (!string.IsNullOrWhiteSpace(menuText))
                    {
                        var menuItems = menuText.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                        var normalizedItems = menuItems.Select(i => i.Trim().ToLower()).ToList();

                        var mappings = await _context.MenuIngredientMappings
                            .Include(m => m.Ingredient)
                            .Where(m => m.Ingredient != null && m.Ingredient.Status == "Active")
                            .ToListAsync();

                        // Filter mappings matching the menu items
                        var matchingMappings = mappings
                            .Where(m => normalizedItems.Any(item => (m.MenuItem ?? "").ToLower().Contains(item) || item.Contains((m.MenuItem ?? "").ToLower())))
                            .ToList();

                        foreach (var mapping in matchingMappings)
                        {
                            var item = mapping.Ingredient;
                            if (item != null && item.Quantity >= mapping.QuantityPerPerson)
                            {
                                // Deduct QuantityPerPerson (representing 1 portion consumed)
                                item.Quantity -= mapping.QuantityPerPerson;
                                item.LastUpdated = DateTime.UtcNow;
                                item.StockStatus = item.Quantity <= item.MinimumStock ? (item.Quantity <= 0 ? "Out of Stock" : "Low Stock") : "In Stock";

                                _context.InventoryTransactions.Add(new InventoryTransaction
                                {
                                    InventoryId = item.InventoryId,
                                    Type = "Stock Out",
                                    Quantity = mapping.QuantityPerPerson,
                                    Remarks = $"QR Auto-deduction: {user.FullName} for {currentMeal}",
                                    CreatedBy = User.FindFirstValue(ClaimTypes.Name) ?? "QR Scanner"
                                });

                                deductedItems.Add($"{item.ItemName} ({mapping.QuantityPerPerson} {item.Unit})");
                            }
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Attendance marked and verified!",
                userName = user.FullName,
                role = user.Role,
                mealType = currentMeal,
                scanTime = log.AttendanceTime,
                deductedInventory = autoDeduct,
                deductedItems
            });
        }

        private void LogFailedScan(int userId, string mealType, string token, string reason, string? deviceInfo)
        {
            try
            {
                var log = new QrAttendance
                {
                    UserId = userId,
                    MealType = mealType,
                    AttendanceDate = DateTime.UtcNow.Date,
                    AttendanceTime = DateTime.Now.ToString("HH:mm:ss"),
                    QrToken = token,
                    VerificationStatus = "Rejected",
                    DeviceInfo = $"Failed: {reason}. Device: {deviceInfo}"
                };
                _context.QrAttendances.Add(log);
                _context.SaveChanges();
            }
            catch { /* safety */ }
        }

        // GET: api/qr-attendance/live
        [HttpGet("live")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetLiveMealCounter()
        {
            var today = DateTime.UtcNow.Date;

            // Total registered headcounts
            var totalStudents = await _context.Users.CountAsync(u => u.Role == "Student");
            var totalStaff = await _context.Users.CountAsync(u => u.Role == "Staff");

            var presentBreakfast = await _context.Attendances.CountAsync(a => a.Date.Date == today && a.MealType == "Breakfast" && a.Status == "Present");
            var presentLunch = await _context.Attendances.CountAsync(a => a.Date.Date == today && a.MealType == "Lunch" && a.Status == "Present");
            var presentDinner = await _context.Attendances.CountAsync(a => a.Date.Date == today && a.MealType == "Dinner" && a.Status == "Present");

            var studentAttendance = await _context.Attendances.Include(a => a.User).CountAsync(a => a.Date.Date == today && a.Status == "Present" && a.User != null && a.User.Role == "Student");
            var staffAttendance = await _context.Attendances.Include(a => a.User).CountAsync(a => a.Date.Date == today && a.Status == "Present" && a.User != null && a.User.Role == "Staff");

            // Compute leaves today to find remaining expected
            var leavesToday = await _context.Leaves.CountAsync(l => l.Status == "Approved" && l.StartDate.Date <= today && l.EndDate.Date >= today);
            var remainingExpected = Math.Max(0, (totalStudents + totalStaff) - studentAttendance - staffAttendance - leavesToday);

            // Fetch last 5 scans
            var recentScans = await _context.QrAttendances
                .Include(q => q.User)
                .OrderByDescending(q => q.AttendanceId)
                .Take(5)
                .Select(q => new
                {
                    q.AttendanceId,
                    UserName = q.User != null ? q.User.FullName : "Unknown",
                    Role = q.User != null ? q.User.Role : "Unknown",
                    q.MealType,
                    q.AttendanceTime,
                    q.VerificationStatus,
                    q.DeviceInfo
                })
                .ToListAsync();

            return Ok(new
            {
                breakfastCount = presentBreakfast,
                lunchCount = presentLunch,
                dinnerCount = presentDinner,
                studentCount = studentAttendance,
                staffCount = staffAttendance,
                remainingExpectedCount = remainingExpected,
                recentScans
            });
        }

        // GET: api/qr-attendance/report
        [HttpGet("report")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetQrAttendanceAnalytics()
        {
            var today = DateTime.UtcNow.Date;
            var last7Days = Enumerable.Range(0, 7).Select(i => today.AddDays(-i)).ToList();
            var last7DaysStr = last7Days.Select(d => d.ToString("yyyy-MM-dd")).ToList();

            var weeklyStats = new List<object>();

            foreach (var date in last7Days)
            {
                var count = await _context.Attendances.CountAsync(a => a.Date.Date == date.Date && a.Status == "Present");
                weeklyStats.Add(new
                {
                    Date = date.ToString("dd MMM"),
                    Count = count
                });
            }

            var mealWise = new[] { "Breakfast", "Lunch", "Dinner" }.Select(async m => new
            {
                Meal = m,
                Count = await _context.Attendances.CountAsync(a => a.Date.Date >= today.AddDays(-7) && a.MealType == m && a.Status == "Present")
            }).Select(t => t.Result).ToList();

            var rolesTrend = new[] { "Student", "Staff" }.Select(async r => new
            {
                Role = r,
                Count = await _context.Attendances.Include(a => a.User).CountAsync(a => a.Date.Date >= today.AddDays(-7) && a.User != null && a.User.Role == r && a.Status == "Present")
            }).Select(t => t.Result).ToList();

            return Ok(new
            {
                weeklyStats,
                mealWise,
                rolesTrend
            });
        }

        // GET: api/users/qrcode/{id}
        [HttpGet("/api/users/qrcode/{id}")]
        [Authorize]
        public async Task<IActionResult> GetUserQrCodeData(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Return user details for QR profile generation
            return Ok(new
            {
                userId = user.Id,
                name = user.FullName,
                role = user.Role,
                department = user.Department ?? "Mess Division",
                designation = user.Designation ?? "N/A",
                activeStatus = user.Role == "Staff" ? (user.EmploymentStatus ?? "Active") : "Active",
                qrToken = $"USER_QR_CODE:{user.Id}:{DateTime.UtcNow.Ticks}"
            });
        }
    }
}
