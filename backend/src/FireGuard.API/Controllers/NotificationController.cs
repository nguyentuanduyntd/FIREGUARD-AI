using System.Security.Claims;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FireGuard.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ICurrentUserService _currentUserService;

        public NotificationController(
            INotificationService notificationService,
            ICurrentUserService currentUserService)
        {
            _notificationService = notificationService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PaginatedList<Notification>>>> GetNotifications(
            [FromQuery] int pageIndex = 1, 
            [FromQuery] int pageSize = 10)
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<PaginatedList<Notification>>.Failure("User not authenticated."));
            }

            var notifications = await _notificationService.GetUserNotificationsAsync(userId, pageIndex, pageSize);
            return Ok(ApiResponse<PaginatedList<Notification>>.Success(notifications));
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<int>.Failure("User not authenticated."));
            }

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(ApiResponse<int>.Success(count));
        }

        [HttpPut("{id}/read")]
        public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(string id)
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<bool>.Failure("User not authenticated."));
            }

            var result = await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(ApiResponse<bool>.Success(result));
        }

        [HttpPut("read-all")]
        public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<bool>.Failure("User not authenticated."));
            }

            var result = await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(ApiResponse<bool>.Success(result));
        }

        [HttpPost("test")]
        public async Task<ActionResult<ApiResponse<Notification>>> SendTestNotification(
            [FromQuery] string title = "Thông báo test", 
            [FromQuery] string message = "Đây là nội dung tin nhắn thông báo kiểm thử.", 
            [FromQuery] string channels = "InApp,Email",
            [FromQuery] string? linkUrl = "/dashboard")
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse<Notification>.Failure("User not authenticated."));
            }

            var notification = await _notificationService.SendNotificationAsync(userId, title, message, channels, linkUrl);
            return Ok(ApiResponse<Notification>.Success(notification));
        }
    }
}
