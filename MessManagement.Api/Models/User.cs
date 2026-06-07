using System.ComponentModel.DataAnnotations.Schema;

namespace MessManagement.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        
        public required string FullName { get; set; }
        
        public required string Email { get; set; }
        
        public required string PasswordHash { get; set; }
        public required string Role { get; set; } // Admin, Student, Staff
        
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        // Staff Profile Fields
        public string? Department { get; set; }
        public string? Designation { get; set; } // Cook, Cleaner, Kitchen Helper, Manager, Accountant, Supervisor, Vendor Coordinator, Store Keeper
        public DateTime? JoiningDate { get; set; }
        public string? SalaryType { get; set; } // Monthly Salary, Daily Wage Salary, Attendance Based Salary, Hourly Wage
        public string? EmploymentType { get; set; } // Permanent, Contract, Daily Wage, Hourly, Part-Time
        public decimal? BaseSalary { get; set; }
        public decimal? DailyWage { get; set; }
        public decimal? OvertimeRate { get; set; }
        public string? BankAccountDetails { get; set; }
        public string? UpiId { get; set; }
        public string? PanNumber { get; set; }
        public string? AadhaarNumber { get; set; }
        public string? EmploymentStatus { get; set; } // Active, On Leave, Resigned, Suspended

        // Navigation properties
        public ICollection<Attendance>? Attendances { get; set; }
        public ICollection<Payment>? Payments { get; set; }
        public ICollection<Feedback>? Feedbacks { get; set; }
        public ICollection<Leave>? Leaves { get; set; }
    }
}
