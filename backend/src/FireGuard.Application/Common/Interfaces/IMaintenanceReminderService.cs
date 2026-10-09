using System.Threading.Tasks;
using FireGuard.Domain.Entities.Services;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IMaintenanceReminderService
    {
        Task RunDailyScanAsync();
        Task<bool> RespondToReminderAsync(string reminderId, ReminderStatus status, string? declineReason);
    }
}
