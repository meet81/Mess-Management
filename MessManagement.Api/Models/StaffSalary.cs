using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MessManagement.Api.Models
{
    public class StaffSalary
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public int Month { get; set; }
        public int Year { get; set; }

        public int TotalWorkingDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }

        public decimal BaseSalary { get; set; }
        public decimal DailySalary { get; set; }
        public decimal PerDaySalary { get; set; } // Backwards compatibility
        public decimal OvertimeRate { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal OvertimeAmount { get; set; }
        public decimal Bonus { get; set; }
        public decimal Incentive { get; set; }
        public decimal FestivalBonus { get; set; }
        public decimal Deductions { get; set; } // Backwards compatibility total deductions
        public decimal LeaveDeduction { get; set; }
        public decimal LatePenalty { get; set; }
        public decimal AdvanceRecovery { get; set; }
        public decimal OtherDeductions { get; set; }
        public int LeaveDays { get; set; }
        public decimal GrossSalary { get; set; }
        public decimal TotalSalary { get; set; } // Backwards compatibility (maps to NetSalary or GrossSalary)
        public decimal NetSalary { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }

        public string Status { get; set; } = "Pending";

        public string? PaymentMethod { get; set; }
        public string? TransactionId { get; set; }
        public DateTime? DatePaid { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}