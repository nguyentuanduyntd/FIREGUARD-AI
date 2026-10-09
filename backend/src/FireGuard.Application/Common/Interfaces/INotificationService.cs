using System.Threading.Tasks;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Notifications;

namespace FireGuard.Application.Common.Interfaces
{
    public interface INotificationService
    {
        Task<Notification> SendNotificationAsync(
            string userId, 
            string title, 
            string message, 
            string channels = "InApp", 
            string? linkUrl = null, 
            string? serviceRequestId = null, 
            string? projectId = null);

        Task<bool> MarkAsReadAsync(string notificationId, string userId);
        Task<bool> MarkAllAsReadAsync(string userId);
        Task<PaginatedList<Notification>> GetUserNotificationsAsync(string userId, int pageIndex, int pageSize);
        Task<int> GetUnreadCountAsync(string userId);
    }
}
