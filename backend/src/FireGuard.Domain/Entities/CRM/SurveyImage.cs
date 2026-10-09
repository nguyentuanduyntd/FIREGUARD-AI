using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public class SurveyImage : BaseEntity<string>
    {
        public SurveyImage()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string SurveyRequestId { get; set; } = null!;
        public virtual SurveyRequest SurveyRequest { get; set; } = null!;

        public string ImageUrl { get; set; } = null!;
    }
}
