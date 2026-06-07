namespace MessManagement.Api.Models
{
    public class Attendance
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public required DateTime Date { get; set; }
        public required string MealType { get; set; } // Breakfast, Lunch, Dinner
        public required string Status { get; set; } // Present, Absent, Pending

        public User? User { get; set; }
    }
}
