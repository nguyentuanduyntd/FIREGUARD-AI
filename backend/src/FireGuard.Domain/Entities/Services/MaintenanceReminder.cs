using System;
using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Services
{
    public enum ReminderStatus
    {
        Pending,
        Proposed,
        Accepted,
        Declined,
        Postponed
    }

    public class MaintenanceReminder : AuditableEntity<string>
    {
        public MaintenanceReminder()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
            Status = ReminderStatus.Pending;
        }

        public string EquipmentAssetId { get; set; } = null!;
        public virtual EquipmentAsset EquipmentAsset { get; set; } = null!;

        public DateTime ScheduledDate { get; set; }
        public string ReminderType { get; set; } = null!; // "Overdue", "3Days", "7Days", "30Days"
        public ReminderStatus Status { get; set; }
        public string? DeclineReason { get; set; }
        
        public string? AssociatedServiceRequestId { get; set; } // Link to created draft request
        public virtual ServiceRequest? AssociatedServiceRequest { get; set; }
    }
}
