using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Sales
{
    public enum SalesOrderStatus
    {
        Draft,
        Confirmed,
        Cancelled
    }

    public class SalesOrder : AuditableEntity<string>
    {
        public SalesOrder()
        {
            Id = Guid.NewGuid().ToString();
            Items = new HashSet<SalesOrderItem>();
        }

        public string OrderNumber { get; set; } = null!;
        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public decimal TotalAmount { get; set; }
        public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Draft;
        public string? Notes { get; set; }

        public virtual ICollection<SalesOrderItem> Items { get; set; }
    }
}
