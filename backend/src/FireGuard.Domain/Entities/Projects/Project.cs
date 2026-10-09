using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Sales;

namespace FireGuard.Domain.Entities.Projects
{
    public enum ProjectStatus
    {
        Planning,
        WaitingForMaterials,
        Ready,
        InProgress,
        Paused,
        WaitingForAcceptance,
        Completed,
        Cancelled
    }

    public class Project : AuditableEntity<string>
    {
        public Project()
        {
            Id = Guid.NewGuid().ToString();
            Tasks = new HashSet<ProjectTask>();
            ProgressLogs = new HashSet<ProjectProgressLog>();
            Installations = new HashSet<ProjectEquipment>();
        }

        public string Name { get; set; } = null!;
        
        public string? ContractId { get; set; }
        public virtual Contract? Contract { get; set; }

        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
        public int ProgressPercentage { get; set; } = 0;

        // Installation Team
        public string? TeamLeaderId { get; set; }
        public string? TeamMembersJson { get; set; } // Comma separated user IDs

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? HandoverDate { get; set; }
        
        public string? AcceptanceRecordUrl { get; set; } // Document verification link
        public string? Notes { get; set; }

        public virtual ICollection<ProjectTask> Tasks { get; set; }
        public virtual ICollection<ProjectProgressLog> ProgressLogs { get; set; }
        public virtual ICollection<ProjectEquipment> Installations { get; set; }
    }
}
