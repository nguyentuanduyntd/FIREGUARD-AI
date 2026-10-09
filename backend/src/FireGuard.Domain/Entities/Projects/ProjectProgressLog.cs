using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Projects
{
    public class ProjectProgressLog : AuditableEntity<string>
    {
        public ProjectProgressLog()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ProjectId { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;

        public int ProgressPercentage { get; set; }
        public string Notes { get; set; } = null!; // Required notes
        public string? ImageUrl { get; set; } // Uploaded image
    }
}
