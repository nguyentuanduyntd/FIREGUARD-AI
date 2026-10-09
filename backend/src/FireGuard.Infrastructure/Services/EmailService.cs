using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FireGuard.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string bodyHtml)
        {
            var host = _configuration["Smtp:Host"];
            var portStr = _configuration["Smtp:Port"];
            var enableSslStr = _configuration["Smtp:EnableSsl"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromAddress = _configuration["Smtp:FromAddress"] ?? "noreply@fireguard.ai";
            var fromName = _configuration["Smtp:FromName"] ?? "FireGuard AI Notifications";

            if (string.IsNullOrEmpty(host) || host == "localhost" || host == "dummy")
            {
                // Development fallback: Log the email content and simulate successful sending
                _logger.LogInformation("SMTP settings not configured or set to dummy. Simulating email send:\nTo: {To}\nSubject: {Subject}\nBody:\n{Body}", 
                    toEmail, subject, bodyHtml);
                await Task.Delay(500); // Simulate network latency
                return;
            }

            int port = int.TryParse(portStr, out var p) ? p : 587;
            bool enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl;

            using var message = new MailMessage();
            message.From = new MailAddress(fromAddress, fromName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.Body = bodyHtml;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(host, port);
            client.EnableSsl = enableSsl;
            
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            try
            {
                _logger.LogInformation("Attempting to send email to {To} via SMTP host {Host}...", toEmail, host);
                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent successfully to {To}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To} via SMTP host {Host}", toEmail, host);
                throw; // Rethrow so Hangfire knows the job failed and can retry
            }
        }
    }
}
