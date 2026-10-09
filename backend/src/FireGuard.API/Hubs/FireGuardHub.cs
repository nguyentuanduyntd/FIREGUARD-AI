using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FireGuard.API.Hubs
{
    [Authorize]
    public class FireGuardHub : Hub
    {
        private readonly ILogger<FireGuardHub> _logger;

        public FireGuardHub(ILogger<FireGuardHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? Context.User?.FindFirstValue("sub") 
                         ?? Context.UserIdentifier;

            if (!string.IsNullOrEmpty(userId))
            {
                // Join personal group: user_{userId}
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation("SignalR Connection {ConnectionId} established for User {UserId}", Context.ConnectionId, userId);

                // Join role groups: role_{roleName}
                var roles = Context.User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
                            ?? Context.User?.FindAll("role").Select(c => c.Value)
                            ?? Enumerable.Empty<string>();

                foreach (var role in roles)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"role_{role}");
                    _logger.LogInformation("SignalR Connection {ConnectionId} joined group role_{Role}", Context.ConnectionId, role);
                }
            }
            else
            {
                _logger.LogWarning("Unauthenticated SignalR connection attempt {ConnectionId}", Context.ConnectionId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? Context.User?.FindFirstValue("sub") 
                         ?? Context.UserIdentifier;

            _logger.LogInformation("SignalR Connection {ConnectionId} disconnected for User {UserId}. Exception: {Exception}", 
                Context.ConnectionId, userId ?? "Unknown", exception?.Message ?? "None");

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinProject(string projectId)
        {
            if (string.IsNullOrWhiteSpace(projectId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId}");
            _logger.LogInformation("Connection {ConnectionId} joined project group project_{ProjectId}", Context.ConnectionId, projectId);
        }

        public async Task LeaveProject(string projectId)
        {
            if (string.IsNullOrWhiteSpace(projectId)) return;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId}");
            _logger.LogInformation("Connection {ConnectionId} left project group project_{ProjectId}", Context.ConnectionId, projectId);
        }

        public async Task JoinServiceRequest(string serviceRequestId)
        {
            if (string.IsNullOrWhiteSpace(serviceRequestId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"servicerequest_{serviceRequestId}");
            _logger.LogInformation("Connection {ConnectionId} joined service request group servicerequest_{ServiceRequestId}", Context.ConnectionId, serviceRequestId);
        }

        public async Task LeaveServiceRequest(string serviceRequestId)
        {
            if (string.IsNullOrWhiteSpace(serviceRequestId)) return;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"servicerequest_{serviceRequestId}");
            _logger.LogInformation("Connection {ConnectionId} left service request group servicerequest_{ServiceRequestId}", Context.ConnectionId, serviceRequestId);
        }
    }
}
