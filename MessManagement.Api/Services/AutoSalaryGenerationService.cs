using MessManagement.Api.Data;
using MessManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Services
{
    public class AutoSalaryGenerationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutoSalaryGenerationService> _logger;

        public AutoSalaryGenerationService(IServiceProvider serviceProvider, ILogger<AutoSalaryGenerationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                
                // Run on the 1st of every month at 01:00 AM (UTC)
                if (now.Day == 1 && now.Hour == 1 && now.Minute == 0)
                {
                    _logger.LogInformation("Auto-generating staff salaries for the previous month...");
                    
                    try
                    {
                        using var scope = _serviceProvider.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        int year = now.Month == 1 ? now.Year - 1 : now.Year;
                        int month = now.Month == 1 ? 12 : now.Month - 1;
                        decimal defaultPerDaySalary = 500;

                        var staffUsers = await context.Users.Where(u => u.Role == "Staff").ToListAsync(stoppingToken);
                        int daysInMonth = DateTime.DaysInMonth(year, month);

                        foreach (var staff in staffUsers)
                        {
                            var existing = await context.StaffSalaries.FirstOrDefaultAsync(s => s.UserId == staff.Id && s.Month == month && s.Year == year, stoppingToken);
                            if (existing != null) continue;

                            var presentDays = await context.Attendances
                                .Where(a => a.UserId == staff.Id && a.Date.Month == month && a.Date.Year == year && a.Status == "Present")
                                .Select(a => a.Date.Date)
                                .Distinct()
                                .CountAsync(stoppingToken);

                            context.StaffSalaries.Add(new StaffSalary
                            {
                                UserId = staff.Id, Month = month, Year = year,
                                TotalWorkingDays = daysInMonth, PresentDays = presentDays, AbsentDays = daysInMonth - presentDays,
                                PerDaySalary = defaultPerDaySalary, Bonus = 0, Deductions = 0, TotalSalary = presentDays * defaultPerDaySalary, RemainingAmount = presentDays * defaultPerDaySalary, PaidAmount = 0, Status = "Pending"
                            });
                        }
                        await context.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Successfully auto-generated salaries.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error occurred while auto-generating salaries.");
                    }
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                }
                else
                {
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }
    }
}