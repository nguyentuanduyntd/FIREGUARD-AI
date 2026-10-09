using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IAuditService
    {
        Task LogAsync(
            string? operatorName,
            string action,
            string module,
            string? entityName,
            string? entityId,
            object? before,
            object? after,
            string? ipAddress,
            string? userAgent,
            string? correlationId,
            bool isSuccess = true,
            string? errorMessage = null
        );

        Task PurgeOldLogsAsync(int retentionDays);
    }
}
