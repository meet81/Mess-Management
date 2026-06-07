using System;

namespace MessManagement.Api.DTOs
{
    public class MealVegetablePlanDto
    {
        public DateTime PlanDate { get; set; }
        public required string MealType { get; set; }
        public int? MenuItemId { get; set; }
        public string? MenuItem { get; set; }
        public int VegetableId { get; set; }
        public required string VegetableName { get; set; }
        public decimal RequiredQuantity { get; set; }
        public string? Unit { get; set; }
        public int ExpectedStudentCount { get; set; }
        public int ExpectedStaffCount { get; set; }
        public int BufferCount { get; set; }
    }
}
