using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Sales
{
    public enum QuotationItemType
    {
        Equipment,
        InstallationService,
        SurveyCost
    }

    public class QuotationItem : BaseEntity<string>
    {
        public QuotationItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string QuotationId { get; set; } = null!;
        public virtual Quotation Quotation { get; set; } = null!;

        public QuotationItemType ItemType { get; set; } = QuotationItemType.Equipment;

        // Can be null if it's a generic service or survey cost
        public string? ModelId { get; set; }
        public virtual EquipmentModel? Model { get; set; }

        public string Name { get; set; } = null!; // Historical item name
        public int Quantity { get; set; }
        
        public decimal UnitPrice { get; set; } // Historical price at the time of quotation
        public decimal TotalPrice { get; set; }
    }
}
