using System;
using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.IAM;

namespace FireGuard.Domain.Entities.Services
{
    public class TechnicianKpi : AuditableEntity<string>
    {
        public TechnicianKpi()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
            IsApproved = false;
        }

        public string TechnicianId { get; set; } = null!;
        public virtual User Technician { get; set; } = null!;

        public int Year { get; set; }
        public int Month { get; set; }

        // Raw metrics metrics
        public double OnTimeRate { get; set; } // %
        public double AcceptanceRate { get; set; } // %
        public double ResponseTimeMinutes { get; set; }
        public int CompletedJobs { get; set; }
        public double CustomerRating { get; set; } // out of 5
        public double FirstTimeFixRate { get; set; } // %
        public int CallbackCount { get; set; }
        public int LateCount { get; set; }
        public double ComplianceRate { get; set; } // %
        public double ReportQualityScore { get; set; } // 0-100
        public int ComplaintCount { get; set; }

        // KPI Scores
        public double RawKpiScore { get; set; } // Calculated 0-100 based on weights
        public double AdjustedScore { get; set; } // Final score (RawKpiScore + AdjustmentValue)
        public double AdjustmentValue { get; set; } // Admin adjustment value (e.g. +5, -10)
        public string? AdjustmentReason { get; set; }
        public string? AdjustedBy { get; set; }
        public DateTime? AdjustedAtUtc { get; set; }

        // AI Summarization & Administrative Review
        public string? AiSummary { get; set; }
        public decimal ProposedBonus { get; set; }
        public decimal ApprovedBonus { get; set; }
        public string? AdminNotes { get; set; }
        public bool IsApproved { get; set; }
    }
}
