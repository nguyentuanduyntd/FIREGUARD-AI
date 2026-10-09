using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class Brand : BaseEntity<string>
    {
        public Brand()
        {
            Id = Guid.NewGuid().ToString();
            EquipmentModels = new HashSet<EquipmentModel>();
        }

        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<EquipmentModel> EquipmentModels { get; set; }
    }
}
