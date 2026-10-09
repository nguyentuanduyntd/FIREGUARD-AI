using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.Projects
{
    public class ProjectEquipment : BaseEntity<string>
    {
        public ProjectEquipment()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ProjectId { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        // Links to the serial number asset if tracked by serial
        public string? EquipmentAssetId { get; set; }
        public virtual EquipmentAsset? EquipmentAsset { get; set; }

        public string? LocationName { get; set; } // Physical installation position
        public bool IsWarrantyActivated { get; set; } = false;
        public DateTime? WarrantyStartDate { get; set; }
    }
}
