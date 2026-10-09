using System;
using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.IAM;

namespace FireGuard.Domain.Entities.Services
{
    public class TechnicianGpsLog : BaseEntity<string>
    {
        public TechnicianGpsLog()
        {
            Id = Guid.NewGuid().ToString();
            TimestampUtc = DateTime.UtcNow;
        }

        public string TechnicianId { get; set; } = null!;
        public virtual User Technician { get; set; } = null!;

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTime TimestampUtc { get; set; }
    }
}
