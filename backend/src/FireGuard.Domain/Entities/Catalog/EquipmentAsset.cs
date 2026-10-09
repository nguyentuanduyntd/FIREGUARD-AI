using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Inventory;

namespace FireGuard.Domain.Entities.Catalog
{
    public class EquipmentAsset : AuditableEntity<string>
    {
        public EquipmentAsset()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public string? WarehouseId { get; set; }
        public virtual Warehouse? Warehouse { get; set; }

        public string? CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        public string SerialNumber { get; set; } = null!;
        public AssetStatus Status { get; set; } = AssetStatus.InStock;
        public decimal PurchasePrice { get; set; }
        public int WarrantyPeriodMonths { get; set; } = 12;
        public DateTime? ManufacturedDate { get; set; }
        public DateTime? ExpiryDate { get; set; }

        // Maintenance Scheduling Attributes
        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }

        public virtual EquipmentQRCode? QRCode { get; set; }
    }
}
