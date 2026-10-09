using System.Threading.Tasks;

namespace FireGuard.Application.Common.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string bodyHtml);
    }
}
