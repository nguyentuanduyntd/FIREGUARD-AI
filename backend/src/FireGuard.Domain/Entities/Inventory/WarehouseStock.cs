using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public class WarehouseStock : BaseEntity<string>
    {
        public WarehouseStock()
        {
            Id = Guid.NewGuid().ToString();
            WarehouseId = Guid.NewGuid().ToString();
            ModelId = Guid.NewGuid().ToString();
            RowVersion = Array.Empty<byte>();
        }

        public string WarehouseId { get; set; } = null!;
        public virtual Warehouse Warehouse { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; } = 5;

        // Concurrency token to handle optimistic concurrency
        public byte[] RowVersion { get; set; } = null!;
    }
}
