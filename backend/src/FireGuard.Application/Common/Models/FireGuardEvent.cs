using System;

namespace FireGuard.Application.Common.Models
{
    public static class FireGuardEventTypes
    {
        public const string ServiceRequestCreated = "ServiceRequestCreated";
        public const string DispatchStarted = "DispatchStarted";
        public const string TechnicianSuggested = "TechnicianSuggested";
        public const string TechnicianAssigned = "TechnicianAssigned";
        public const string TechnicianAccepted = "TechnicianAccepted";
        public const string TechnicianRejected = "TechnicianRejected";
        public const string TechnicianOnTheWay = "TechnicianOnTheWay";
        public const string TechnicianCheckedIn = "TechnicianCheckedIn";
        public const string RepairStarted = "RepairStarted";
        public const string RepairProgressUpdated = "RepairProgressUpdated";
        public const string ServiceCompleted = "ServiceCompleted";
        public const string ProjectProgressUpdated = "ProjectProgressUpdated";
        public const string InventoryLow = "InventoryLow";
        public const string MaintenanceReminderCreated = "MaintenanceReminderCreated";
        public const string NotificationCreated = "NotificationCreated";
    }

    public class FireGuardEventEnvelope
    {
        public string EventId { get; set; } = Guid.NewGuid().ToString();
        public string EventType { get; set; } = string.Empty;
        public object Data { get; set; } = null!;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
