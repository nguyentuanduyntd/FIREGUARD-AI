using System.Threading.Tasks;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using Microsoft.AspNetCore.SignalR;

namespace FireGuard.API.Services
{
    public class FireGuardEventService : IFireGuardEventService
    {
        private readonly IHubContext<FireGuardHub> _hubContext;

        public FireGuardEventService(IHubContext<FireGuardHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task PublishToUserAsync(string userId, string eventType, object data)
        {
            var envelope = new FireGuardEventEnvelope
            {
                EventType = eventType,
                Data = data
            };
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveEvent", envelope);
        }

        public async Task PublishToRoleAsync(string roleName, string eventType, object data)
        {
            var envelope = new FireGuardEventEnvelope
            {
                EventType = eventType,
                Data = data
            };
            await _hubContext.Clients.Group($"role_{roleName}").SendAsync("ReceiveEvent", envelope);
        }

        public async Task PublishToProjectAsync(string projectId, string eventType, object data)
        {
            var envelope = new FireGuardEventEnvelope
            {
                EventType = eventType,
                Data = data
            };
            await _hubContext.Clients.Group($"project_{projectId}").SendAsync("ReceiveEvent", envelope);
        }

        public async Task PublishToServiceRequestAsync(string serviceRequestId, string eventType, object data)
        {
            var envelope = new FireGuardEventEnvelope
            {
                EventType = eventType,
                Data = data
            };
            await _hubContext.Clients.Group($"servicerequest_{serviceRequestId}").SendAsync("ReceiveEvent", envelope);
        }

        public async Task PublishToAllAsync(string eventType, object data)
        {
            var envelope = new FireGuardEventEnvelope
            {
                EventType = eventType,
                Data = data
            };
            await _hubContext.Clients.All.SendAsync("ReceiveEvent", envelope);
        }
    }
}
