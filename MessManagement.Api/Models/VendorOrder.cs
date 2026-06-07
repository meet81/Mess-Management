using System;

namespace MessManagement.Api.Models
{
    public class VendorOrder
    {
        public int VendorOrderId { get; set; }

        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }
        public string? VendorName { get; set; }

        public int IngredientId { get; set; }
        public InventoryItem? Ingredient { get; set; }
        public required string IngredientName { get; set; }

        public decimal Quantity { get; set; }
        public required string Unit { get; set; }
        public decimal Rate { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string Status { get; set; } = "Draft";
        public bool RequiresAdminApproval { get; set; }
        public bool IsAdminApproved { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string? CreatedBy { get; set; }
    }
}
