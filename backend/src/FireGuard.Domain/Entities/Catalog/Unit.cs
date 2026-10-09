using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class Unit : BaseEntity<string>
    {
        public Unit()
        {
            Id = Guid.NewGuid().ToString();
            EquipmentModels = new HashSet<EquipmentModel>();
        }

        public string Name { get; set; } = null!; // e.g. Cái, Bộ, Mét, Cuộn
        public string? Description { get; set; }

        public virtual ICollection<EquipmentModel> EquipmentModels { get; set; }
    }
}
