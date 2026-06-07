using System;

namespace MessManagement.Api.Models
{
    public class DailyVegetableUsage
    {
        public int Id { get; set; }
        public int? PlanId { get; set; }
        public DateTime UsageDate { get; set; }
        public required string MealType { get; set; }
        public string? MenuItem { get; set; }
        
        public int VegetableId { get; set; }
        public InventoryItem? Vegetable { get; set; }
        
        public required string VegetableName { get; set; }
        public decimal PlannedQuantity { get; set; }
        public decimal ActualUsedQuantity { get; set; }
        public decimal WastedQuantity { get; set; }
        public decimal RemainingQuantity { get; set; }
        
        public required string UsageStatus { get; set; } // Not Used, Under Used, Properly Used, Over Used
        public bool MarkMealPrepared { get; set; } = true;
        public bool DeductedFromInventory { get; set; } = true;
        public bool WastageCannotBeReused { get; set; } = true;
        public bool ConfirmedUsageEntry { get; set; } = true;
        public bool LowStockAlertSent { get; set; }
        public string? Remarks { get; set; }
        
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
