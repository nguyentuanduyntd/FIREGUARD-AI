using System;
using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Services
{
    public enum ReportType
    {
        Revenue,
        Quotation,
        Project,
        Inventory,
        Maintenance,
        Repairs,
        TechnicianPerformance,
        CustomerRating,
        EquipmentStatus
    }

    public enum ExportStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    public class ReportExport : AuditableEntity<string>
    {
        public ReportExport()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
            Status = ExportStatus.Pending;
        }

        public string RequestedBy { get; set; } = null!;
        public ReportType ReportType { get; set; }
        public string FileFormat { get; set; } = null!; // "Excel" or "PDF"
        public string? FileUrl { get; set; } // MinIO URL or Local Fallback path
        public ExportStatus Status { get; set; }
        public string? ErrorMessage { get; set; }

        // Filter criteria saved as JSON string
        public string? FiltersJson { get; set; }

        public DateTime? ExpiresAtUtc { get; set; }
    }
}
