using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.CRM
{
    public class CustomerAddress : BaseEntity<string>
    {
        public CustomerAddress()
        {
            Id = Guid.NewGuid().ToString();
            CustomerId = Guid.NewGuid().ToString();
            AddressLine = "Default Address";
            District = "District 1";
            City = "Ho Chi Minh";
        }

        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public string AddressLine { get; set; } = null!;
        public string? Ward { get; set; }
        public string District { get; set; } = null!;
        public string City { get; set; } = null!;
        public bool IsDefault { get; set; } = false;
        
        // Coordinates for PCCC map and technician routing
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
