using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class EquipmentCategory : BaseEntity<string>
    {
        public EquipmentCategory()
        {
            Id = Guid.NewGuid().ToString();
            EquipmentModels = new HashSet<EquipmentModel>();
        }

        public string Name { get; set; } = null!;
        public string? Description { get; set; }

        public virtual ICollection<EquipmentModel> EquipmentModels { get; set; }
    }
}
