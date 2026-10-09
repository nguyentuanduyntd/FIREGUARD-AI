using System;
using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Services
{
    public class AIDiagnosisLog : AuditableEntity<string>
    {
        public AIDiagnosisLog()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
        }

        public string EquipmentModel { get; set; } = null!;
        public double EquipmentAge { get; set; }
        public string Symptoms { get; set; } = null!;
        public string? RepairHistory { get; set; }
        public string? LastMaintenance { get; set; }
        public string? ErrorCode { get; set; }
        public string? ImageUrl { get; set; }

        // AI Response payload (JSON serialized)
        public string AIResponseJson { get; set; } = null!;

        // Feedback evaluation from Technician
        public bool? IsCorrect { get; set; }
        public string? TechnicianFeedback { get; set; }
        public string? EvaluatedByUserId { get; set; }
        public DateTime? EvaluatedAtUtc { get; set; }
    }
}
