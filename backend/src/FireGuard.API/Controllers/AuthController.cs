using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Application.DTOs.Auth;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Infrastructure.Identity;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    public class RegisterCustomerRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
    }

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

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<TokenResponse>>> Register([FromBody] RegisterCustomerRequest request, [FromServices] ApplicationDbContext context)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(ApiResponse<TokenResponse>.Failure("Vui lòng nhập họ và tên."));

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(ApiResponse<TokenResponse>.Failure("Vui lòng nhập Email."));

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
                return BadRequest(ApiResponse<TokenResponse>.Failure("Mật khẩu phải chứa ít nhất 6 ký tự."));

            var normalizedEmail = request.Email.Trim().ToLower();
            if (await context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
                return BadRequest(ApiResponse<TokenResponse>.Failure("Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác."));

            var username = normalizedEmail.Split('@')[0];
            if (await context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
            {
                username = $"{username}_{new Random().Next(100, 999)}";
            }

            var custRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "CUSTOMER");
            if (custRole == null)
            {
                custRole = new Role { Name = "CUSTOMER", Description = "Customer Representative" };
                await context.Roles.AddAsync(custRole);
                await context.SaveChangesAsync();
            }

            var newUser = new User
            {
                Username = username,
                Email = normalizedEmail,
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber?.Trim(),
                Address = request.Address?.Trim(),
                Department = "Khách Hàng",
                PasswordHash = PasswordHasher.HashPassword(request.Password),
                IsActive = true
            };

            await context.Users.AddAsync(newUser);
            await context.SaveChangesAsync();

            await context.UserRoles.AddAsync(new UserRole
            {
                UserId = newUser.Id,
                RoleId = custRole.Id
            });
            await context.SaveChangesAsync();

            // Create corresponding Customer CRM record if not exists
            var existingCust = await context.Customers.FirstOrDefaultAsync(c => c.Email == normalizedEmail);
            if (existingCust == null)
            {
                var custEntity = new Customer
                {
                    Name = request.FullName.Trim(),
                    Email = normalizedEmail,
                    Phone = request.PhoneNumber?.Trim() ?? "0900000000",
                    IsActive = true
                };
                await context.Customers.AddAsync(custEntity);
                await context.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(request.Address))
                {
                    await context.CustomerAddresses.AddAsync(new CustomerAddress
                    {
                        CustomerId = custEntity.Id,
                        AddressLine = request.Address.Trim(),
                        District = "Đống Đa",
                        City = "Hà Nội",
                        IsDefault = true
                    });
                    await context.SaveChangesAsync();
                }
            }

            var deviceName = Request.Headers["User-Agent"].ToString() ?? "Unknown Device";
            var loginResult = await _identityService.LoginAsync(new LoginRequest { Email = normalizedEmail, Password = request.Password }, deviceName, null, null);

            if (!loginResult.Succeeded)
            {
                return Ok(ApiResponse<TokenResponse>.Success(null!, "Đăng ký tài khoản thành công! Vui lòng đăng nhập."));
            }

            SetRefreshTokenCookie(loginResult.Data.RefreshToken);
            return Ok(ApiResponse<TokenResponse>.Success(loginResult.Data, "Đăng ký tài khoản và tự động đăng nhập thành công!"));
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
                Secure = true, // Force HTTPS
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}
