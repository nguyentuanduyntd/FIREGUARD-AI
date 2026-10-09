using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public class StockReceiptItem : BaseEntity<string>
    {
        public StockReceiptItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ReceiptId { get; set; } = null!;
        public virtual StockReceipt Receipt { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        
        // List of serial numbers entered (if the model requires serials)
        public string? SerialNumbers { get; set; } // Comma separated values
    }
}
