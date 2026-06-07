using System;

namespace MessManagement.Api.Models
{
    public class MealVegetablePlan
    {
        public int Id { get; set; }
        public DateTime PlanDate { get; set; }
        public required string MealType { get; set; } // Breakfast, Lunch, Dinner
        public int? MenuItemId { get; set; }
        public string? MenuItem { get; set; }
        
        public int VegetableId { get; set; }
        public InventoryItem? Vegetable { get; set; }
        
        public required string VegetableName { get; set; }
        public decimal RequiredQuantity { get; set; }
        public required string Unit { get; set; }
        
        public int ExpectedStudentCount { get; set; }
        public int ExpectedStaffCount { get; set; }
        public int ApprovedLeaveCount { get; set; }
        public int StaffAttendanceCount { get; set; }
        public int AttendanceTrendCount { get; set; }
        public int BufferCount { get; set; }
        public int TotalExpectedMealCount { get; set; }
        public string CalculatedStatus { get; set; } = "Manual";
        
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
