using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Projects
{
    public enum ProjectTaskStatus
    {
        Todo,
        InProgress,
        Completed
    }

    public class ProjectTask : BaseEntity<string>
    {
        public ProjectTask()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ProjectId { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;

        public string TaskName { get; set; } = null!;
        public string? Description { get; set; }
        
        public string? AssignedToUserId { get; set; }
        public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.Todo;
        public int Progress { get; set; } = 0; // 0 to 100
    }
}
