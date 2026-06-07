using System;

namespace MessManagement.Api.DTOs
{
    public class DailyVegetableUsageDto
    {
        public DateTime UsageDate { get; set; }
        public required string MealType { get; set; }
        public int? PlanId { get; set; }
        public string? MenuItem { get; set; }
        public int VegetableId { get; set; }
        public required string VegetableName { get; set; }
        public decimal PlannedQuantity { get; set; }
        public decimal ActualUsedQuantity { get; set; }
        public decimal WastedQuantity { get; set; }
        public bool MarkMealPrepared { get; set; } = true;
        public bool DeductStockFromInventory { get; set; } = true;
        public bool WastageCannotBeReused { get; set; } = true;
        public bool ConfirmUsageEntry { get; set; } = true;
        public bool SendLowStockAlertAfterDeduction { get; set; } = true;
        public string? Remarks { get; set; }
    }
}
