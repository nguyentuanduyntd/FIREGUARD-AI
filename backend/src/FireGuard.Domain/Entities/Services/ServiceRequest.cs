using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Services
{
    public enum ServiceRequestType
    {
        Maintenance,
        Repair,
        Replace,
        Installation
    }

    public enum UrgencyLevel
    {
        Low,
        Medium,
        High,
        Emergency
    }

    public enum ServiceRequestStatus
    {
        Created,
        AwaitingDispatch,
        Dispatching,
        Assigned,
        TechnicianAccepted,
        TechnicianRejected,
        OnTheWay,
        CheckedIn,
        Diagnosing,
        Repairing,
        WaitingForPart,
        Completed,
        CustomerConfirmed,
        Cancelled
    }

    public class ServiceRequest : AuditableEntity<string>
    {
        public ServiceRequest()
        {
            Id = Guid.NewGuid().ToString();
            CustomerId = Guid.NewGuid().ToString();
            AddressId = Guid.NewGuid().ToString();
            Description = "Service Request Description";
            RowVersion = Array.Empty<byte>();
            StatusLogs = new HashSet<ServiceRequestStatusLog>();
        }

        public string RequestNumber { get; set; } = null!;

        // AI Automated Dispatch Fields
        public string? CurrentOfferedTechnicianId { get; set; }
        public DateTime? OfferExpiresAtUtc { get; set; }
        public int CurrentOfferAttemptIndex { get; set; }
        public string? DispatchRecommendationId { get; set; }
        public virtual ServiceRequestDispatch? DispatchRecommendation { get; set; }
        
        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string AddressId { get; set; } = null!;
        public virtual CustomerAddress Address { get; set; } = null!;

        public string? EquipmentAssetId { get; set; }
        public virtual EquipmentAsset? EquipmentAsset { get; set; }

        public string? QRCodeValue { get; set; }
        
        public string Description { get; set; } = null!;
        public UrgencyLevel Urgency { get; set; } = UrgencyLevel.Medium;
        
        public DateTime DesiredTime { get; set; }
        public ServiceRequestType RequestType { get; set; } = ServiceRequestType.Repair;
        public ServiceRequestStatus Status { get; set; } = ServiceRequestStatus.Created;

        public string? AssignedTechnicianId { get; set; } // IAM user ID
        
        // Optimistic concurrency check token
        public byte[] RowVersion { get; set; } = null!;

        public virtual ICollection<ServiceRequestStatusLog> StatusLogs { get; set; }
    }
}
