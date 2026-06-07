namespace MessManagement.Api.DTOs
{
    public class MenuDto
    {
        public required string DayOfWeek { get; set; }
        public required string Breakfast { get; set; }
        public required string Lunch { get; set; }
        public required string Dinner { get; set; }
    }

    public class AttendanceDto
    {
        public int UserId { get; set; }
        public required DateTime Date { get; set; }
        public required string MealType { get; set; }
        public required string Status { get; set; }
    }

    public class PaymentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public required string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? DatePaid { get; set; }
    }

    public class FeedbackDto
    {
        public required string Category { get; set; }
        public required string Message { get; set; }
    }

    public class LeaveDto
    {
        public int UserId { get; set; }
        public required DateTime StartDate { get; set; }
        public required DateTime EndDate { get; set; }
        public bool BreakfastLeave { get; set; }
        public bool LunchLeave { get; set; }
        public bool DinnerLeave { get; set; }
        public required string Reason { get; set; }
        public string Status { get; set; } = "Pending";
    }
}
