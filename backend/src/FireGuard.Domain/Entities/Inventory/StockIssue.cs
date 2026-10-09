using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Inventory
{
    public enum IssueStatus
    {
        Draft,
        Confirmed
    }

    public enum IssueType
    {
        Export,
        Adjustment,
        Transfer
    }

    public class StockIssue : AuditableEntity<string>
    {
        public StockIssue()
        {
            Id = Guid.NewGuid().ToString();
            Items = new HashSet<StockIssueItem>();
        }

        public string IssueNumber { get; set; } = null!;
        public string WarehouseId { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;

        public string? CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        public IssueType IssueType { get; set; } = IssueType.Export;
        public IssueStatus Status { get; set; } = IssueStatus.Draft;
        public string? Notes { get; set; }

        public virtual ICollection<StockIssueItem> Items { get; set; }
    }
}
