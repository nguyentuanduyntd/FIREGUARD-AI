using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using FireGuard.Domain.Entities.IAM;

namespace FireGuard.Application.Common.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions);
        Task<string> GenerateRefreshTokenAsync(string userId, string deviceName, string? osVersion, string? pushToken);
        Task<Result<TokenResponse>> RotateRefreshTokenAsync(string refreshToken, string deviceName, string? osVersion, string? pushToken);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken);
        Task<bool> RevokeAllUserTokensAsync(string userId);
    }
}
