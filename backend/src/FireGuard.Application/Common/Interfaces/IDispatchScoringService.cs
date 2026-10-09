using System.Collections.Generic;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.Services;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IDispatchScoringService
    {
        Task<ServiceRequestDispatch> GenerateRecommendationAsync(
            string serviceRequestId,
            double maxDistanceKm = 30.0,
            double distanceWeight = 0.25,
            double skillWeight = 0.25,
            double availabilityWeight = 0.15,
            double ratingWeight = 0.10,
            double workloadWeight = 0.10,
            double firstTimeFixWeight = 0.10,
            double acceptanceWeight = 0.05
        );
    }
}
