using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public enum TransactionType
    {
        Import,
        Export,
        Transfer,
        Adjustment
    }

    public class StockTransaction : BaseEntity<string>
    {
        public StockTransaction()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string WarehouseId { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; } // Positive for inbound, negative for outbound
        public TransactionType TransactionType { get; set; }
        public string ReferenceNumber { get; set; } = null!; // ReceiptNumber or IssueNumber
        public string? Notes { get; set; }
    }
}
