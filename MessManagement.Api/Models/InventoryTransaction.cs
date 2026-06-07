using System;

namespace MessManagement.Api.Models
{
    public class InventoryTransaction
    {
        public int TransactionId { get; set; }
        
        public int InventoryId { get; set; }
        public InventoryItem? InventoryItem { get; set; }
        
        public required string Type { get; set; } // "Stock In" or "Stock Out"
        public decimal Quantity { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? Remarks { get; set; }
        public string? CreatedBy { get; set; }
    }
}
