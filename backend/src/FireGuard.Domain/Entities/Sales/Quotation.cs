using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Sales
{
    public enum QuotationStatus
    {
        Draft,
        Sent,
        Viewed,
        Accepted,
        Rejected,
        Expired,
        Converted,
        Cancelled
    }

    public class Quotation : AuditableEntity<string>
    {
        public Quotation()
        {
            Id = Guid.NewGuid().ToString();
            QuotationNumber = "QT-" + Guid.NewGuid().ToString().Substring(0, 8);
            Items = new HashSet<QuotationItem>();
            Version = 1;
        }

        public string QuotationNumber { get; set; } = null!;
        public int Version { get; set; }

        // Self-referencing relationship for versioning history
        public string? ParentQuotationId { get; set; }
        public virtual Quotation? ParentQuotation { get; set; }

        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public DateTime ExpirationDate { get; set; }
        
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal VatRate { get; set; } // e.g. 8% or 10%
        public decimal VatAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
        public string? Notes { get; set; }

        public virtual ICollection<QuotationItem> Items { get; set; }
    }
}
