using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class EquipmentModel : BaseEntity<string>
    {
        public EquipmentModel()
        {
            Id = Guid.NewGuid().ToString();
            BrandId = "brand_default";
            CategoryId = "cat_default";
            UnitId = "unit_default";
            ModelCode = "MOD-DEFAULT";
            Name = "Default Model";
            EquipmentAssets = new HashSet<EquipmentAsset>();
        }

        public string CategoryId { get; set; } = null!;
        public virtual EquipmentCategory Category { get; set; } = null!;

        public string BrandId { get; set; } = null!;
        public virtual Brand Brand { get; set; } = null!;

        public string UnitId { get; set; } = null!;
        public virtual Unit Unit { get; set; } = null!;

        public string? SupplierId { get; set; }
        public virtual Supplier? Supplier { get; set; }

        public string ModelCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        
        public int WarrantyMonths { get; set; }
        public int MaintenanceIntervalMonths { get; set; }
        
        public string? Specifications { get; set; } // JSON or text
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true; // Business status (true = active, false = discontinued)

        public virtual ICollection<EquipmentAsset> EquipmentAssets { get; set; }
    }
}
