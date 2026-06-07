namespace MessManagement.Api.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public required string Status { get; set; } // Paid, Pending, Partial
        
        public string? PaymentMethod { get; set; } // Cash, Card, UPI
        public string? TransactionId { get; set; }
        public string? ReceiptImageUrl { get; set; }

        public int BreakfastCount { get; set; }
        public int LunchCount { get; set; }
        public int DinnerCount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DatePaid { get; set; }

        public User? User { get; set; }
    }
}
