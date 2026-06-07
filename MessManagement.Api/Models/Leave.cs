using System.ComponentModel.DataAnnotations;

namespace MessManagement.Api.Models
{
    public class Leave
    {
        [Key]
        public int LeaveId { get; set; }
        
        public int UserId { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        public bool BreakfastLeave { get; set; }
        public bool LunchLeave { get; set; }
        public bool DinnerLeave { get; set; }
        
        [Required]
        public string Reason { get; set; } = string.Empty;
        
        [Required]
        public string Status { get; set; } = "Pending"; // Approved, Pending, Rejected
        
        // Navigation Property
        public User? User { get; set; }
    }
}
