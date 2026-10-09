using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;

namespace FireGuard.Domain.Entities.CRM
{
    public class SurveyProposedItem : BaseEntity<string>
    {
        public SurveyProposedItem()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string SurveyRequestId { get; set; } = null!;
        public virtual SurveyRequest SurveyRequest { get; set; } = null!;

        public string ModelId { get; set; } = null!;
        public virtual EquipmentModel Model { get; set; } = null!;

        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }
}
