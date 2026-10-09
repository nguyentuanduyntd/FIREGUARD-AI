using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FireGuard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IIdentityService _identityService;
        private readonly ITokenService _tokenService;
        private readonly ICurrentUserService _currentUserService;

        public AuthController(
            IIdentityService identityService,
            ITokenService tokenService,
            ICurrentUserService currentUserService)
        {
            _identityService = identityService;
            _tokenService = tokenService;
            _currentUserService = currentUserService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<TokenResponse>>> Login([FromBody] LoginRequest request)
        {
            // Simple FluentValidation validation check (if not running through middleware)
            var validator = new LoginRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToArray();
                return BadRequest(ApiResponse<TokenResponse>.Failure(errors, "Validation failed."));
            }

            var deviceName = Request.Headers["User-Agent"].ToString() ?? "Unknown Device";
            var result = await _identityService.LoginAsync(request, deviceName, null, null);

            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<TokenResponse>.Failure(result.Errors, "Login failed."));
            }

            SetRefreshTokenCookie(result.Data.RefreshToken);

            return Ok(ApiResponse<TokenResponse>.Success(result.Data, "Login successful."));
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<ApiResponse<TokenResponse>>> Refresh([FromBody] RefreshTokenRequest? request)
        {
            // Read refresh token from cookie or request body
            var refreshToken = request?.RefreshToken ?? Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
            {
                return BadRequest(ApiResponse<TokenResponse>.Failure("Refresh token is required."));
            }

            var deviceName = Request.Headers["User-Agent"].ToString() ?? "Unknown Device";
            var result = await _tokenService.RotateRefreshTokenAsync(refreshToken, deviceName, null, null);

            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<TokenResponse>.Failure(result.Errors, "Token rotation failed."));
            }

            SetRefreshTokenCookie(result.Data.RefreshToken);

            return Ok(ApiResponse<TokenResponse>.Success(result.Data, "Token refreshed successfully."));
        }

        [HttpPost("logout")]
        public async Task<ActionResult<ApiResponse<bool>>> Logout([FromBody] RefreshTokenRequest? request)
        {
            var refreshToken = request?.RefreshToken ?? Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
            {
                return BadRequest(ApiResponse<bool>.Failure("Refresh token is required."));
            }

            var succeeded = await _tokenService.RevokeRefreshTokenAsync(refreshToken);
            
            Response.Cookies.Delete("refreshToken");

            if (!succeeded)
            {
                return BadRequest(ApiResponse<bool>.Failure("Invalid refresh token."));
            }

            return Ok(ApiResponse<bool>.Success(true, "Logged out successfully."));
        }

        [Authorize]
        [HttpPost("logout-all")]
        public async Task<ActionResult<ApiResponse<bool>>> LogoutAll()
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var succeeded = await _tokenService.RevokeAllUserTokensAsync(userId);
            
            Response.Cookies.Delete("refreshToken");

            return Ok(ApiResponse<bool>.Success(succeeded, "All sessions revoked successfully."));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetMe()
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var userDto = await _identityService.GetCurrentUserAsync(userId);
            if (userDto == null)
            {
                return NotFound(ApiResponse<UserDto>.Failure("User profile not found."));
            }

            return Ok(ApiResponse<UserDto>.Success(userDto));
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<ActionResult<ApiResponse<bool>>> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var validator = new ChangePasswordRequestValidator();
            var validationResult = await validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToArray();
                return BadRequest(ApiResponse<bool>.Failure(errors, "Validation failed."));
            }

            var result = await _identityService.ChangePasswordAsync(userId, request);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<bool>.Failure(result.Errors));
            }

            return Ok(ApiResponse<bool>.Success(true, "Password changed successfully."));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("lock/{userId}")]
        public async Task<ActionResult<ApiResponse<bool>>> LockUser(string userId, [FromQuery] bool @lock)
        {
            var result = await _identityService.LockUserAsync(userId, @lock);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse<bool>.Failure(result.Errors));
            }

            var message = @lock ? "User locked successfully." : "User unlocked successfully.";
            return Ok(ApiResponse<bool>.Success(true, message));
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Allow HTTP for local dev
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}
