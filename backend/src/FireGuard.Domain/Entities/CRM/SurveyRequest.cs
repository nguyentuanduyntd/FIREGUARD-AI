using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public enum SurveyStatus
    {
        Pending,
        Assigned,
        CheckedIn,
        Completed,
        Converted
    }

    public class SurveyRequest : AuditableEntity<string>
    {
        public SurveyRequest()
        {
            Id = Guid.NewGuid().ToString();
            Images = new HashSet<SurveyImage>();
            ProposedItems = new HashSet<SurveyProposedItem>();
        }

        public string RequestNumber { get; set; } = null!;
        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string AddressId { get; set; } = null!;
        public virtual CustomerAddress Address { get; set; } = null!;

        public DateTime ScheduledDate { get; set; }
        
        // Assigned user / team leader
        public string? AssignedUserId { get; set; }
        public SurveyStatus Status { get; set; } = SurveyStatus.Pending;

        // Survey Specifications
        public double Area { get; set; }
        public int FloorCount { get; set; }
        public string? BuildingType { get; set; } // e.g. Factory, Apartment, Office
        public int RoomCount { get; set; }
        public string? BuildingMaterial { get; set; }
        public string? RiskLevel { get; set; } // e.g. Low, Medium, High
        public string? ExistingPcccSystem { get; set; }
        public string? CustomerRequirements { get; set; }
        public string? ResultNotes { get; set; }

        // GPS Check-in Coordinates
        public double? CheckedInLatitude { get; set; }
        public double? CheckedInLongitude { get; set; }
        public DateTime? CheckedInTime { get; set; }

        public virtual ICollection<SurveyImage> Images { get; set; }
        public virtual ICollection<SurveyProposedItem> ProposedItems { get; set; }
    }
}
