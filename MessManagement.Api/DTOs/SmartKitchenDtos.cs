using System;

namespace MessManagement.Api.DTOs
{
    public class MenuIngredientMappingDto
    {
        public int? MenuItemId { get; set; }
        public required string MenuItem { get; set; }
        public string? MenuItemName { get; set; }
        public int IngredientId { get; set; }
        public string? IngredientName { get; set; }
        public decimal QuantityPerPerson { get; set; }
        public string? Unit { get; set; }
        public bool IsRequired { get; set; } = true;
        public string? MealType { get; set; }
        public bool IsOptional { get; set; }
        public string? Status { get; set; }
    }

    public class MealPlanCalculateDto
    {
        public DateTime PlanDate { get; set; }
        public required string MealType { get; set; }
        public int BufferCount { get; set; }
        public int? ExpectedStudents { get; set; }
        public int? ExpectedStaff { get; set; }
        public string? MenuItems { get; set; }
    }

    public class VendorOrderDto
    {
        public int? VendorId { get; set; }
        public string? VendorName { get; set; }
        public int IngredientId { get; set; }
        public string? IngredientName { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal Rate { get; set; }
        public DateTime? OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? Status { get; set; }
        public bool RequiresAdminApproval { get; set; }
    }

    public class VendorOrderStatusDto
    {
        public required string Status { get; set; }
    }
}
