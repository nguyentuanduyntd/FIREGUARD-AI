using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IAIService
    {
        Task<string> ChatAsync(object requestBody);
        Task<string> SuggestQuotationAsync(object requestBody);
        Task<string> DiagnoseFaultAsync(object requestBody);
        Task<string> RankDispatchAsync(object requestBody);
        Task<string> CalculateKPIAsync(object requestBody);
    }
}
