using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Services
{
    public class ServiceRequestStatusLog : BaseEntity<string>
    {
        public ServiceRequestStatusLog()
        {
            Id = Guid.NewGuid().ToString();
            ChangedAtUtc = DateTime.UtcNow;
        }

        public string ServiceRequestId { get; set; } = null!;
        public virtual ServiceRequest ServiceRequest { get; set; } = null!;

        public ServiceRequestStatus FromStatus { get; set; }
        public ServiceRequestStatus ToStatus { get; set; }
        public string? Notes { get; set; }
        
        public string ChangedBy { get; set; } = null!;
        public DateTime ChangedAtUtc { get; set; }
    }
}
