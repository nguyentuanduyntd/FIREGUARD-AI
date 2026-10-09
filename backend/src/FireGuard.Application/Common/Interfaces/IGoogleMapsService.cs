using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IGoogleMapsService
    {
        Task<(double distanceKm, double durationMinutes)> GetDistanceAndDurationAsync(double lat1, double lon1, double lat2, double lon2);
    }
}
