using System;

namespace MessManagement.Api.Models
{
    public class MenuIngredientMapping
    {
        public int Id { get; set; }
        public int? MenuItemId { get; set; }
        public required string MenuItem { get; set; }
        public string? MenuItemName { get; set; }

        public int IngredientId { get; set; }
        public InventoryItem? Ingredient { get; set; }
        public required string IngredientName { get; set; }

        public decimal QuantityPerPerson { get; set; }
        public required string Unit { get; set; }
        public bool IsRequired { get; set; } = true;
        public string? MealType { get; set; }
        public bool IsOptional { get; set; } = false;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
