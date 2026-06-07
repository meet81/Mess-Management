using System;

namespace MessManagement.Api.Models
{
    public class VendorOrderSuggestion
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; } // The date the order is FOR (next day)
        
        public int VegetableId { get; set; }
        public InventoryItem? Vegetable { get; set; }
        public int IngredientId
        {
            get => VegetableId;
            set => VegetableId = value;
        }
        
        public required string VegetableName { get; set; }
        public decimal AvailableStock { get; set; }
        public decimal NextDayRequiredQuantity { get; set; }
        public decimal SafetyStock { get; set; }
        public decimal SuggestedOrderQuantity { get; set; }
        
        public int? PreferredVendorId { get; set; }
        public Vendor? PreferredVendor { get; set; }
        public string? PreferredVendorName { get; set; }
        
        public decimal LastPurchaseRate { get; set; }
        public decimal EstimatedCost { get; set; }
        
        public required string RecommendationStatus { get; set; } // Order Now, Do Not Order, Use Existing Stock, Low Stock Alert
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
