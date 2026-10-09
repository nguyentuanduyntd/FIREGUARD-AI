using System;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.Notifications;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class MaintenanceReminderService : IMaintenanceReminderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public MaintenanceReminderService(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task RunDailyScanAsync()
        {
            // Fetch admin user IDs to send notifications to real users instead of the hardcoded "ADMIN"
            var adminUserIds = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin"))
                .Select(u => u.Id)
                .ToListAsync();

            var assets = await _context.EquipmentAssets
                .Include(a => a.Model)
                .Include(a => a.Customer)
                    .ThenInclude(c => c!.Addresses)
                .Where(a => a.CustomerId != null && a.NextMaintenanceDate != null)
                .ToListAsync();

            var today = DateTime.UtcNow.Date;

            foreach (var asset in assets)
            {
                var nextMaint = asset.NextMaintenanceDate!.Value.Date;
                var daysLeft = (nextMaint - today).Days;

                string? type = null;
                if (daysLeft < 0) type = "Overdue";
                else if (daysLeft == 3) type = "3Days";
                else if (daysLeft == 7) type = "7Days";
                else if (daysLeft == 30) type = "30Days";

                if (type == null) continue;

                // Check idempotency: avoid duplicate reminders in the same cycle
                var exists = await _context.MaintenanceReminders
                    .AnyAsync(r => r.EquipmentAssetId == asset.Id && 
                                   r.ScheduledDate.Date == nextMaint && 
                                   r.ReminderType == type);

                if (exists) continue;

                // 1. Create Maintenance Reminder Log
                var reminder = new MaintenanceReminder
                {
                    EquipmentAssetId = asset.Id,
                    ReminderType = type,
                    ScheduledDate = asset.NextMaintenanceDate.Value,
                    Status = ReminderStatus.Proposed
                };

                // 2. Resolve Customer Default Address
                var defaultAddress = asset.Customer?.Addresses.FirstOrDefault(a => a.IsDefault) 
                                     ?? asset.Customer?.Addresses.FirstOrDefault();

                if (defaultAddress != null && asset.Customer != null)
                {
                    // 3. Create Draft Service Request
                    var draftRequest = new ServiceRequest
                    {
                        RequestNumber = $"SR-MAINT-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 4)}",
                        CustomerId = asset.CustomerId!,
                        AddressId = defaultAddress.Id,
                        EquipmentAssetId = asset.Id,
                        Description = $"Bảo trì định kỳ tự động cho thiết bị {asset.Model.Name} (S/N: {asset.SerialNumber}) - Trạng thái: {type}.",
                        Urgency = UrgencyLevel.Medium,
                        RequestType = ServiceRequestType.Maintenance,
                        Status = ServiceRequestStatus.Created,
                        DesiredTime = asset.NextMaintenanceDate.Value
                    };

                    await _context.ServiceRequests.AddAsync(draftRequest);
                    await _context.SaveChangesAsync();

                    reminder.AssociatedServiceRequestId = draftRequest.Id;
                }

                await _context.MaintenanceReminders.AddAsync(reminder);
                await _context.SaveChangesAsync();

                // 4. Create In-App Notification for Client
                if (asset.Customer != null)
                {
                    // Find if the customer has an associated user account via Email
                    var clientUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == asset.Customer.Email);
                    if (clientUser != null)
                    {
                        var clientNotification = new Notification
                        {
                            UserId = clientUser.Id,
                            Title = "Đề xuất lịch bảo trì thiết bị PCCC",
                            Message = $"Thiết bị {asset.Model.Name} (S/N: {asset.SerialNumber}) sắp đến hạn bảo trì ({type}). Hệ thống đề xuất lịch kiểm tra vào ngày {asset.NextMaintenanceDate.Value:dd/MM/yyyy}. Quý khách vui lòng xác nhận hoặc từ chối lịch này.",
                            IsRead = false
                        };
                        await _context.Notifications.AddAsync(clientNotification);
                    }

                    // Send email to customer
                    await _emailService.SendEmailAsync(
                        asset.Customer.Email,
                        "Nhắc nhở bảo trì định kỳ - FireGuard AI",
                        $"<h3>Kính gửi quý khách {asset.Customer.Name},</h3>" +
                        $"<p>Thiết bị <strong>{asset.Model.Name}</strong> của quý khách sắp đến hạn bảo trì ({type}).</p>" +
                        $"<p>Lịch đề xuất: {asset.NextMaintenanceDate.Value:dd/MM/yyyy}.</p>" +
                        $"<p>Vui lòng đăng nhập hệ thống FireGuard AI để xác nhận lịch hẹn.</p>"
                    );
                }

                // 5. Create Notification for Admins
                foreach (var adminId in adminUserIds)
                {
                    var adminNotification = new Notification
                    {
                        UserId = adminId,
                        Title = "Cảnh báo bảo trì thiết bị mới",
                        Message = $"Hệ thống tự động tạo đề xuất bảo trì ({type}) cho khách hàng {asset.Customer?.Name} - Thiết bị {asset.Model.Name}.",
                        IsRead = false
                    };
                    await _context.Notifications.AddAsync(adminNotification);
                }
                
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> RespondToReminderAsync(string reminderId, ReminderStatus status, string? declineReason)
        {
            var reminder = await _context.MaintenanceReminders
                .Include(r => r.AssociatedServiceRequest)
                .FirstOrDefaultAsync(r => r.Id == reminderId);

            if (reminder == null) return false;

            reminder.Status = status;
            if (status == ReminderStatus.Declined || status == ReminderStatus.Postponed)
            {
                reminder.DeclineReason = declineReason;
                
                // If customer declines/postpones, cancel the draft request
                if (reminder.AssociatedServiceRequest != null)
                {
                    reminder.AssociatedServiceRequest.Status = ServiceRequestStatus.Cancelled;
                    _context.ServiceRequests.Update(reminder.AssociatedServiceRequest);
                }
            }
            else if (status == ReminderStatus.Accepted)
            {
                // If customer accepts, transition draft request to AwaitingDispatch to trigger AI Dispatch
                if (reminder.AssociatedServiceRequest != null)
                {
                    reminder.AssociatedServiceRequest.Status = ServiceRequestStatus.AwaitingDispatch;
                    _context.ServiceRequests.Update(reminder.AssociatedServiceRequest);
                }
            }

            _context.MaintenanceReminders.Update(reminder);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
