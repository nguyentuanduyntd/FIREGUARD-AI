using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Inventory
{
    public class Warehouse : BaseEntity<string>
    {
        public Warehouse()
        {
            Id = Guid.NewGuid().ToString();
            Stocks = new HashSet<WarehouseStock>();
            Assets = new HashSet<EquipmentAsset>();
        }

        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string? ContactPerson { get; set; }
        public string? ContactPhone { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<WarehouseStock> Stocks { get; set; }
        public virtual ICollection<EquipmentAsset> Assets { get; set; }
    }
}
