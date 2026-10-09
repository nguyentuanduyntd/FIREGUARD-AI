using System;
using System.Collections.Generic;
using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Services
{
    public class ServiceRequestDispatch : AuditableEntity<string>
    {
        public ServiceRequestDispatch()
        {
            Id = Guid.NewGuid().ToString();
            ServiceRequestId = Guid.NewGuid().ToString();
            CreatedAtUtc = DateTime.UtcNow;
            TechnicianScores = new List<TechnicianDispatchScore>();
        }

        public string ServiceRequestId { get; set; } = null!;
        public virtual ServiceRequest ServiceRequest { get; set; } = null!;

        // Configured weights used for this recommendation
        public double DistanceWeight { get; set; }
        public double SkillWeight { get; set; }
        public double AvailabilityWeight { get; set; }
        public double RatingWeight { get; set; }
        public double WorkloadWeight { get; set; }
        public double FirstTimeFixWeight { get; set; }
        public double AcceptanceWeight { get; set; }

        public virtual ICollection<TechnicianDispatchScore> TechnicianScores { get; set; }
        
        public string? ChosenTechnicianId { get; set; }
        public string? DispatchNotes { get; set; }
    }

    public class TechnicianDispatchScore : BaseEntity<string>
    {
        public TechnicianDispatchScore()
        {
            Id = Guid.NewGuid().ToString();
            DispatchRecommendationId = Guid.NewGuid().ToString();
            TechnicianId = Guid.NewGuid().ToString();
            TechnicianName = "Technician";
            ScoreBreakdownJson = "{}";
            RankingExplanation = "Explanation";
        }

        public string DispatchRecommendationId { get; set; } = null!;
        public string TechnicianId { get; set; } = null!;
        public string TechnicianName { get; set; } = null!;

        // Individual category scores out of 100
        public double DistanceScore { get; set; }
        public double SkillScore { get; set; }
        public double AvailabilityScore { get; set; }
        public double RatingScore { get; set; }
        public double WorkloadScore { get; set; }
        public double FirstTimeFixScore { get; set; }
        public double AcceptanceScore { get; set; }

        public double TotalScore { get; set; }
        public string ScoreBreakdownJson { get; set; } = null!; // Holds raw values (e.g. distance: 5.2km, rating: 4.8)
        public string RankingExplanation { get; set; } = null!; // Text justification
    }
}
