using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace FireGuard.API.Authorization
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context, 
            PermissionRequirement requirement)
        {
            var user = context.User;

            if (user == null || !user.Identity?.IsAuthenticated == true)
            {
                return Task.CompletedTask;
            }

            // Admin bypasses all checks
            if (user.IsInRole("ADMIN"))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Check specific permission claim
            var hasPermission = user.Claims.Any(c => 
                c.Type == "permission" && 
                string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
