using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Application.Common.Models;
using FireGuard.Domain.Entities.Notifications;
using FireGuard.Infrastructure.Persistence;
using Hangfire;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FireGuard.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<FireGuardHub> _hubContext;
        private readonly IBackgroundJobClient _backgroundJobs;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            ApplicationDbContext context,
            IHubContext<FireGuardHub> hubContext,
            IBackgroundJobClient backgroundJobs,
            IServiceScopeFactory serviceScopeFactory,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _backgroundJobs = backgroundJobs;
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        public async Task<Notification> SendNotificationAsync(
            string userId, 
            string title, 
            string message, 
            string channels = "InApp", 
            string? linkUrl = null, 
            string? serviceRequestId = null, 
            string? projectId = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new ArgumentException($"User with ID {userId} not found.", nameof(userId));
            }

            // Create notification
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Channels = channels,
                LinkUrl = linkUrl,
                ServiceRequestId = serviceRequestId,
                ProjectId = projectId
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // 1. Send InApp notification via SignalR
            if (channels.Contains("InApp"))
            {
                var envelope = new FireGuardEventEnvelope
                {
                    EventType = FireGuardEventTypes.NotificationCreated,
                    Data = new
                    {
                        id = notification.Id,
                        title = notification.Title,
                        message = notification.Message,
                        linkUrl = notification.LinkUrl,
                        serviceRequestId = notification.ServiceRequestId,
                        projectId = notification.ProjectId,
                        createdAtUtc = notification.CreatedAtUtc,
                        isRead = notification.IsRead
                    }
                };

                await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveEvent", envelope);
            }

            // 2. Queue Email sending via Hangfire Background Job
            if (channels.Contains("Email") && !string.IsNullOrEmpty(user.Email))
            {
                var emailLog = new EmailLog
                {
                    NotificationId = notification.Id,
                    RecipientEmail = user.Email,
                    Subject = title,
                    BodyHtml = EmailTemplateHelper.GenerateNotificationEmail(title, message, linkUrl),
                    Status = "Pending"
                };

                _context.EmailLogs.Add(emailLog);
                await _context.SaveChangesAsync();

                // Enqueue background Hangfire Job
                _backgroundJobs.Enqueue<NotificationService>(x => x.SendBackgroundEmailJobAsync(emailLog.Id));
            }

            return notification;
        }

        public async Task<bool> MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null || notification.IsRead)
            {
                return false;
            }

            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;

            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkAllAsReadAsync(string userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (!unreadNotifications.Any())
            {
                return false;
            }

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAtUtc = DateTime.UtcNow;
            }

            _context.Notifications.UpdateRange(unreadNotifications);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PaginatedList<Notification>> GetUserNotificationsAsync(string userId, int pageIndex, int pageSize)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAtUtc);

            var count = await query.CountAsync();
            var items = await query
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedList<Notification>(items, count, pageIndex, pageSize);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        // Hangfire Job Handler (runs in background)
        [Queue("default")]
        [AutomaticRetry(Attempts = 3, LogEvents = true)]
        public async Task SendBackgroundEmailJobAsync(string emailLogId)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var emailLog = await dbContext.EmailLogs.FindAsync(emailLogId);
            if (emailLog == null)
            {
                _logger.LogWarning("Hangfire Email Job: EmailLog with ID {EmailLogId} not found.", emailLogId);
                return;
            }

            emailLog.RetryCount++;

            try
            {
                await emailService.SendEmailAsync(emailLog.RecipientEmail, emailLog.Subject, emailLog.BodyHtml);
                emailLog.Status = "Sent";
                emailLog.SentAtUtc = DateTime.UtcNow;
                emailLog.ErrorMessage = null;
            }
            catch (Exception ex)
            {
                emailLog.ErrorMessage = ex.Message;
                if (emailLog.RetryCount >= emailLog.MaxRetries)
                {
                    emailLog.Status = "Failed";
                }
                else
                {
                    emailLog.Status = "Pending";
                }
                
                dbContext.EmailLogs.Update(emailLog);
                await dbContext.SaveChangesAsync();
                
                throw; // Rethrow so Hangfire registers job failure and triggers retry schedule
            }

            dbContext.EmailLogs.Update(emailLog);
            await dbContext.SaveChangesAsync();
        }
    }
}
