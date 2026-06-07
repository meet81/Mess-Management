namespace MessManagement.Api.Models
{
    public class Feedback
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public required string Category { get; set; } // Quality, Hygiene, Menu, Staff, Other
        public required string Message { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Reviewed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}
