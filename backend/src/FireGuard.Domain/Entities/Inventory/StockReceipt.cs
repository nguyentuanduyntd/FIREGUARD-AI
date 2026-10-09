using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public enum ReceiptStatus
    {
        Draft,
        Confirmed
    }

    public enum ReceiptType
    {
        Import,
        Adjustment,
        Transfer
    }

    public class StockReceipt : AuditableEntity<string>
    {
        public StockReceipt()
        {
            Id = Guid.NewGuid().ToString();
            Items = new HashSet<StockReceiptItem>();
        }

        public string ReceiptNumber { get; set; } = null!;
        public string WarehouseId { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;

        public string? SupplierId { get; set; }
        public virtual Supplier? Supplier { get; set; }

        public ReceiptType ReceiptType { get; set; } = ReceiptType.Import;
        public ReceiptStatus Status { get; set; } = ReceiptStatus.Draft;
        public string? Notes { get; set; }

        public virtual ICollection<StockReceiptItem> Items { get; set; }
    }
}
