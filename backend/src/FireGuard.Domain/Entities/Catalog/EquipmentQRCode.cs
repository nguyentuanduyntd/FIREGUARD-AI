using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Catalog
{
    public class EquipmentQRCode : BaseEntity<string>
    {
        public EquipmentQRCode()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string AssetId { get; set; } = null!;
        public virtual EquipmentAsset Asset { get; set; } = null!;

        public string QRCodePayload { get; set; } = null!;
    }
}
