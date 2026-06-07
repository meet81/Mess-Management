using System;

namespace MessManagement.Api.DTOs
{
    public class InventoryItemDto
    {
        public required string ItemName { get; set; }
        public required string Category { get; set; }
        public decimal Quantity { get; set; }
        public required string Unit { get; set; }
        public decimal MinimumStock { get; set; }
        public decimal SafetyStock { get; set; }
        public decimal PurchasePrice { get; set; }
        public int? VendorId { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsPerishable { get; set; }
        public bool IsActive { get; set; } = true;
        public bool AlertWhenLowStock { get; set; } = true;
        public bool UseInMealPlanning { get; set; } = true;
    }
}
