using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Sales
{
    public class SalesOrderItem : BaseEntity<string>
    {
        public SalesOrderItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string OrderId { get; set; } = null!;
        public virtual SalesOrder Order { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
