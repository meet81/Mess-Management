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
    public class FeedbackController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FeedbackController(AppDbContext context)
        {
            _context = context;
        }

        // Admin can view all
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllFeedback()
        {
            var feedbackList = await _context.Feedbacks
                .Include(f => f.User)
                .Select(f => new
                {
                    f.Id,
                    f.UserId,
                    UserName = f.User!.FullName,
                    UserRole = f.User.Role,
                    f.Category,
                    f.Message,
                    f.Status,
                    f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(feedbackList);
        }

        // Students view their own history
        [HttpGet("my")]
        public async Task<IActionResult> GetMyFeedback()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var feedbackList = await _context.Feedbacks
                .Where(f => f.UserId == userId)
                .Select(f => new
                {
                    f.Id,
                    f.UserId,
                    UserName = f.User != null ? f.User.FullName : "You",
                    UserRole = f.User != null ? f.User.Role : "Student",
                    f.Category,
                    f.Message,
                    f.Status,
                    f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(feedbackList);
        }

        // Students/Staff submit feedback
        [HttpPost]
        public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var feedback = new Feedback
            {
                UserId = userId,
                Category = dto.Category,
                Message = dto.Message,
                Status = "Pending"
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();
            
            return Ok(new
            {
                feedback.Id,
                feedback.UserId,
                feedback.Category,
                feedback.Message,
                feedback.Status,
                feedback.CreatedAt
            });
        }

        // Admin marks as reviewed
        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkReviewed(int id)
        {
            var feedback = await _context.Feedbacks.FindAsync(id);
            if (feedback == null) return NotFound("Feedback not found.");

            feedback.Status = "Reviewed";
            await _context.SaveChangesAsync();
            return Ok(feedback);
        }
    }
}
