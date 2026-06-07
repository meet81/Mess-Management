using System;

namespace MessManagement.Api.Models
{
    public class InventoryItem
    {
        public int InventoryId { get; set; }
        public required string ItemName { get; set; }
        public required string Category { get; set; } // Vegetables, Fruits, Rice, etc.
        public decimal Quantity { get; set; }
        public required string Unit { get; set; } // kg, liters, packets, etc.
        public decimal MinimumStock { get; set; }
        public decimal SafetyStock { get; set; }
        public string StockStatus { get; set; } = "In Stock"; // Low Stock, Out of Stock, etc.
        public decimal PurchasePrice { get; set; }
        
        // Vendor relationship
        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public DateTime? ExpiryDate { get; set; }
        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public bool IsPerishable { get; set; }
        public bool AlertWhenLowStock { get; set; } = true;
        public bool UseInMealPlanning { get; set; } = true;
        public string Status { get; set; } = "Active";
    }
}
