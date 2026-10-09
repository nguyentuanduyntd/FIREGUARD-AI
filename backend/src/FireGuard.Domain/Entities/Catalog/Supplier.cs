using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class Supplier : BaseEntity<string>
    {
        public Supplier()
        {
            Id = Guid.NewGuid().ToString();
            EquipmentModels = new HashSet<EquipmentModel>();
        }

        public string Name { get; set; } = null!;
        public string? TaxCode { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<EquipmentModel> EquipmentModels { get; set; }
    }
}
