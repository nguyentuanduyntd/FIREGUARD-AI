using System.Threading.Tasks;
using FireGuard.Domain.Entities.Services;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IReportService
    {
        Task<string> TriggerExportAsync(ReportType type, string format, string filtersJson, string username);
        Task ProcessExportAsync(string exportId);
    }
}
