namespace MessManagement.Api.Models
{
    public class Menu
    {
        public int Id { get; set; }
        public required string DayOfWeek { get; set; } // Monday, Tuesday, etc.
        public required string Breakfast { get; set; }
        public required string Lunch { get; set; }
        public required string Dinner { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
