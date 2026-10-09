using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface ITechnicianKpiService
    {
        Task CalculateMonthlyKpiAsync(int year, int month);
        Task<bool> AdjustKpiAsync(string kpiId, double adjustmentValue, string reason, string adminUsername);
        Task<bool> ApproveKpiAsync(string kpiId, decimal approvedBonus, string? adminNotes);
    }
}
