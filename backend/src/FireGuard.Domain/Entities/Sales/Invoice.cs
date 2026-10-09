using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Sales
{
    public enum InvoiceStatus
    {
        Draft,
        Issued,
        Paid,
        Overdue,
        Cancelled
    }

    public class Invoice : AuditableEntity<string>
    {
        public Invoice()
        {
            Id = Guid.NewGuid().ToString();
            Items = new HashSet<InvoiceItem>();
        }

        public string InvoiceNumber { get; set; } = null!;
        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string? SalesOrderId { get; set; }
        public virtual SalesOrder? SalesOrder { get; set; }

        public string? ContractId { get; set; }
        public virtual Contract? Contract { get; set; }

        public string? TaxCode { get; set; }
        public decimal SubTotal { get; set; }
        public decimal VatRate { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalAmount { get; set; }
        
        public decimal AmountPaid { get; set; } = 0;
        public decimal DebtRemaining { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
        public string? Notes { get; set; }

        public virtual ICollection<InvoiceItem> Items { get; set; }
    }
}
