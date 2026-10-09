using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Sales
{
    public class InvoiceItem : BaseEntity<string>
    {
        public InvoiceItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string InvoiceId { get; set; } = null!;
        public virtual Invoice Invoice { get; set; } = null!;

        public string Description { get; set; } = null!; // Equipment Name or Service details
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
