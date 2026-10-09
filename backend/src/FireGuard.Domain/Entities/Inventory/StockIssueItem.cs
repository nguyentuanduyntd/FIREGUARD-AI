using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public class StockIssueItem : BaseEntity<string>
    {
        public StockIssueItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string IssueId { get; set; } = null!;
        public virtual StockIssue Issue { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        // List of serial numbers chosen for export (comma-separated)
        public string? SerialNumbers { get; set; }
    }
}
