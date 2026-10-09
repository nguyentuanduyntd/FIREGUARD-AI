using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IDispatchOrchestrationService
    {
        Task StartDispatchWorkflowAsync(string serviceRequestId);
        Task EvaluateOfferTimeoutAsync(string serviceRequestId, string offeredTechnicianId, int attemptIndex);
        Task<bool> AcceptOfferAsync(string serviceRequestId, string technicianId);
        Task<bool> RejectOfferAsync(string serviceRequestId, string technicianId, string? reason);
    }
}
