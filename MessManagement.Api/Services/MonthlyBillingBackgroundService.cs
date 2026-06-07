using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MessManagement.Api.Data;
using MessManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Services
{
    public class MonthlyBillingBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public MonthlyBillingBackgroundService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;

                // ✅ Run anytime on 1st day (safe window)
                if (now.Day == 1)
                {
                    await GenerateBillsAsync();
                    
                    // ✅ Prevent multiple runs in same day
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                    continue;
                }

                // Check every 1 hour instead of 1 minute (optimized)
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task GenerateBillsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var prevMonthDate = DateTime.UtcNow.AddMonths(-1);
            int month = prevMonthDate.Month;
            int year = prevMonthDate.Year;

            var users = await context.Users
                .Where(u => u.Role == "Student")
                .ToListAsync();

            decimal breakfastPrice = 30;
            decimal lunchPrice = 60;
            decimal dinnerPrice = 50;

            foreach (var user in users)
            {
                var existingPayment = await context.Payments
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.Month == month && p.Year == year);

                var attendances = await context.Attendances
                    .Where(a => a.UserId == user.Id
                             && a.Date.Month == month
                             && a.Date.Year == year
                             && a.Status == "Present")
                    .ToListAsync();

                int breakfast = attendances.Count(a => a.MealType == "Breakfast");
                int lunch = attendances.Count(a => a.MealType == "Lunch");
                int dinner = attendances.Count(a => a.MealType == "Dinner");

                decimal totalAmount = (breakfast * breakfastPrice)
                                    + (lunch * lunchPrice)
                                    + (dinner * dinnerPrice);

                if (existingPayment == null)
                {
                    context.Payments.Add(new Payment
                    {
                        UserId = user.Id,
                        Month = month,
                        Year = year,
                        FromDate = new DateTime(year, month, 1),
                        ToDate = new DateTime(year, month, DateTime.DaysInMonth(year, month)),
                        TotalAmount = totalAmount,
                        PaidAmount = 0,
                        RemainingAmount = totalAmount,
                        Status = "Pending",
                        BreakfastCount = breakfast,
                        LunchCount = lunch,
                        DinnerCount = dinner
                    });
                }
                else
                {
                    // ✅ Do not override fully paid bills
                    if (existingPayment.Status == "Paid") continue;

                    existingPayment.BreakfastCount = breakfast;
                    existingPayment.LunchCount = lunch;
                    existingPayment.DinnerCount = dinner;
                    existingPayment.TotalAmount = totalAmount;
                    existingPayment.RemainingAmount = totalAmount - existingPayment.PaidAmount;

                    existingPayment.Status =
                        existingPayment.RemainingAmount <= 0 ? "Paid" :
                        existingPayment.PaidAmount > 0 ? "Partial" : "Pending";
                }
            }

            await context.SaveChangesAsync();
        }
    }
}