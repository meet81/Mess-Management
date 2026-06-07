using System.Security.Claims;
using MessManagement.Api.Data;
using MessManagement.Api.Models;
using MessManagement.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllPayments([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] string? status, [FromQuery] int? month, [FromQuery] int? year)
        {
            var query = _context.Payments.Include(p => p.User).AsQueryable();
            if (month.HasValue && month > 0) query = query.Where(p => p.Month == month.Value);
            if (year.HasValue && year > 0) query = query.Where(p => p.Year == year.Value);
            
            if (fromDate.HasValue) query = query.Where(p => p.FromDate >= fromDate.Value.Date || (p.FromDate == null && p.Month >= fromDate.Value.Month && p.Year >= fromDate.Value.Year));
            if (toDate.HasValue) query = query.Where(p => p.ToDate <= toDate.Value.Date || (p.ToDate == null && p.Month <= toDate.Value.Month && p.Year <= toDate.Value.Year));
            if (!string.IsNullOrEmpty(status)) query = query.Where(p => p.Status == status);

            var payments = await query
                .Select(p => new
                {
                    p.Id,
                    p.UserId,
                    UserName = p.User!.FullName,
                    p.Month,
                    p.Year,
                    p.FromDate,
                    p.ToDate,
                    p.TotalAmount,
                    p.PaidAmount,
                    p.RemainingAmount,
                    p.Status,
                    p.DatePaid,
                    p.CreatedAt,
                    p.BreakfastCount,
                    p.LunchCount,
                    p.DinnerCount,
                    p.ReceiptImageUrl
                })
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month).ThenByDescending(p => p.Id)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("student/{userId}")]
        public async Task<IActionResult> GetStudentPayments(int userId)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentRole != "Admin" && userId.ToString() != currentUserId)
            {
                return Forbid();
            }

            var payments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyPayments()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            if(!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var payments = await _context.Payments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                .ToListAsync();

            return Ok(payments);
        }

        public class GenerateDto
        {
            public DateTime FromDate { get; set; }
            public DateTime ToDate { get; set; }
            public string UserType { get; set; } = "All"; // "All", "Student", "Staff", "ParticularStudent"
            public int? UserId { get; set; }
        }

        [HttpPost("generate-range")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateBills([FromBody] GenerateDto dto)
        {
            if (dto.FromDate > dto.ToDate) return BadRequest("FromDate cannot be greater than ToDate.");

            decimal breakfastPrice = 30;
            decimal lunchPrice = 60;
            decimal dinnerPrice = 50;

            var usersQuery = _context.Users.AsQueryable();
            if (dto.UserType == "ParticularStudent")
            {
                if (!dto.UserId.HasValue || dto.UserId.Value <= 0)
                    return BadRequest("Valid UserId is required for ParticularStudent.");
                usersQuery = usersQuery.Where(u => u.Id == dto.UserId.Value);
            }
            else if (dto.UserType == "Student") usersQuery = usersQuery.Where(u => u.Role == "Student");
            else if (dto.UserType == "Staff") usersQuery = usersQuery.Where(u => u.Role == "Staff");
            else usersQuery = usersQuery.Where(u => u.Role == "Student" || u.Role == "Staff");

            var users = await usersQuery.ToListAsync();

            int generatedCount = 0;

            foreach (var user in users)
            {
                var existingPayment = await _context.Payments.FirstOrDefaultAsync(p => p.UserId == user.Id && p.FromDate == dto.FromDate.Date && p.ToDate == dto.ToDate.Date);
                if (existingPayment != null && existingPayment.Status == "Paid") continue;

                var attendances = await _context.Attendances
                    .Where(a => a.UserId == user.Id && a.Date.Date >= dto.FromDate.Date && a.Date.Date <= dto.ToDate.Date && a.Status == "Present")
                    .ToListAsync();
                
                int breakfastAttended = attendances.Count(a => a.MealType == "Breakfast");
                int lunchAttended = attendances.Count(a => a.MealType == "Lunch");
                int dinnerAttended = attendances.Count(a => a.MealType == "Dinner");

                decimal totalAmount = (breakfastAttended * breakfastPrice) + (lunchAttended * lunchPrice) + (dinnerAttended * dinnerPrice);
                
                if (totalAmount == 0 && existingPayment == null) continue;

                if (existingPayment == null)
                {
                    var payment = new Payment
                    {
                        UserId = user.Id,
                        FromDate = dto.FromDate.Date,
                        ToDate = dto.ToDate.Date,
                        Month = dto.FromDate.Month,
                        Year = dto.FromDate.Year,
                        TotalAmount = totalAmount,
                        PaidAmount = 0,
                        RemainingAmount = totalAmount,
                        Status = "Pending",
                        BreakfastCount = breakfastAttended,
                        LunchCount = lunchAttended,
                        DinnerCount = dinnerAttended
                    };
                    _context.Payments.Add(payment);
                }
                else
                {
                    existingPayment.BreakfastCount = breakfastAttended;
                    existingPayment.LunchCount = lunchAttended;
                    existingPayment.DinnerCount = dinnerAttended;
                    existingPayment.TotalAmount = totalAmount;
                    existingPayment.RemainingAmount = totalAmount - existingPayment.PaidAmount;
                    existingPayment.Status = existingPayment.RemainingAmount <= 0 ? "Paid" : (existingPayment.PaidAmount > 0 ? "Partial" : "Pending");
                }
                generatedCount++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Generated {generatedCount} bills from {dto.FromDate:yyyy-MM-dd} to {dto.ToDate:yyyy-MM-dd}." });
        }

        public class PayDto 
        {
            public decimal Amount { get; set; }
            public required string PaymentMethod { get; set; } // Cash, Card, UPI
            public string? TransactionId { get; set; }
            public IFormFile? ReceiptImage { get; set; }
        }

        [HttpPost("pay/{id}")]
        public async Task<IActionResult> PayAmount(int id, [FromForm] PayDto dto)
        {
            if (dto.Amount <= 0) return BadRequest("Amount must be greater than 0");
            if (string.IsNullOrEmpty(dto.PaymentMethod)) return BadRequest("PaymentMethod is required.");

            var payment = await _context.Payments.FindAsync(id);
            if (payment == null) return NotFound("Invoice not found.");

            var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentRole != "Admin" && payment.UserId.ToString() != currentUserIdStr)
                return Forbid();

            if (payment.RemainingAmount < dto.Amount)
                return BadRequest("Amount exceeds remaining amount.");

            payment.PaidAmount += dto.Amount;
            payment.RemainingAmount -= dto.Amount;
            
            // Assign Payment Method
            payment.PaymentMethod = dto.PaymentMethod;
            if (!string.IsNullOrEmpty(dto.TransactionId))
                payment.TransactionId = dto.TransactionId;

            if (dto.ReceiptImage != null)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "receipts");
                Directory.CreateDirectory(uploadsFolder);
                var uniqueFileName = Guid.NewGuid().ToString() + "_" + dto.ReceiptImage.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ReceiptImage.CopyToAsync(fileStream);
                }
                payment.ReceiptImageUrl = $"/receipts/{uniqueFileName}";
            }

            if (payment.RemainingAmount <= 0)
            {
                payment.Status = "Paid";
                payment.DatePaid = DateTime.UtcNow;
            }
            else
            {
                payment.Status = "Partial";
            }

            await _context.SaveChangesAsync();
            return Ok(payment);
        }
    }
}
