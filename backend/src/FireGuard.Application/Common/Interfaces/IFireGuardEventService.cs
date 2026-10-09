using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IFireGuardEventService
    {
        Task PublishToUserAsync(string userId, string eventType, object data);
        Task PublishToRoleAsync(string roleName, string eventType, object data);
        Task PublishToProjectAsync(string projectId, string eventType, object data);
        Task PublishToServiceRequestAsync(string serviceRequestId, string eventType, object data);
        Task PublishToAllAsync(string eventType, object data);
    }
}
