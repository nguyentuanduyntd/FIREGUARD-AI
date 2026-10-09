using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<Result<TokenResponse>> LoginAsync(LoginRequest request, string deviceName, string? osVersion, string? pushToken);
        Task<Result> ChangePasswordAsync(string userId, ChangePasswordRequest request);
        Task<Result> LockUserAsync(string userId, bool lockUser);
        Task<UserDto?> GetCurrentUserAsync(string userId);
    }
}
