using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class MaintenanceReminderServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_MaintenanceReminderScan_CategorizesCorrectlyAndCreatesDrafts()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEmail = new Mock<IEmailService>();
            var service = new MaintenanceReminderService(context, mockEmail.Object);

            var customer = new Customer { Id = "cust_1", Name = "Client A", Email = "c1@test.com", Phone = "1" };
            var address = new CustomerAddress { Id = "addr_1", CustomerId = "cust_1", AddressLine = "Address", IsDefault = true };
            customer.Addresses.Add(address);

            var model = new EquipmentModel { Id = "model_1", Name = "Smoke Sensor", ModelCode = "S1", Description = "A" };

            // 1. Overdue asset
            var overdueAsset = new EquipmentAsset
            {
                Id = "asset_overdue",
                CustomerId = "cust_1",
                ModelId = "model_1",
                SerialNumber = "SN-OVERDUE",
                Status = AssetStatus.Installed,
                NextMaintenanceDate = DateTime.UtcNow.AddDays(-2) // Overdue
            };

            // 2. 3 Days asset
            var threeDaysAsset = new EquipmentAsset
            {
                Id = "asset_3d",
                CustomerId = "cust_1",
                ModelId = "model_1",
                SerialNumber = "SN-3D",
                Status = AssetStatus.Installed,
                NextMaintenanceDate = DateTime.UtcNow.AddDays(3) // 3 Days
            };

            await context.Customers.AddAsync(customer);
            await context.EquipmentModels.AddAsync(model);
            await context.EquipmentAssets.AddRangeAsync(overdueAsset, threeDaysAsset);
            await context.SaveChangesAsync();

            // Act
            await service.RunDailyScanAsync();

            // Assert
            var reminders = await context.MaintenanceReminders.ToListAsync();
            Assert.Equal(2, reminders.Count);
            
            var rOverdue = reminders.First(r => r.EquipmentAssetId == "asset_overdue");
            Assert.Equal("Overdue", rOverdue.ReminderType);
            Assert.NotNull(rOverdue.AssociatedServiceRequestId);

            var r3d = reminders.First(r => r.EquipmentAssetId == "asset_3d");
            Assert.Equal("3Days", r3d.ReminderType);
            Assert.NotNull(r3d.AssociatedServiceRequestId);

            // Verify draft requests exist in Created status
            var drafts = await context.ServiceRequests.ToListAsync();
            Assert.Equal(2, drafts.Count);
            Assert.All(drafts, d => Assert.Equal(ServiceRequestStatus.Created, d.Status));
        }

        [Fact]
        public async Task Test_MaintenanceReminderScan_Idempotent_NoDuplicates()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEmail = new Mock<IEmailService>();
            var service = new MaintenanceReminderService(context, mockEmail.Object);

            var customer = new Customer { Id = "cust_1", Name = "Client A", Email = "c1@test.com", Phone = "1" };
            var address = new CustomerAddress { Id = "addr_1", CustomerId = "cust_1", AddressLine = "Address", IsDefault = true };
            customer.Addresses.Add(address);
            var model = new EquipmentModel { Id = "model_1", Name = "Smoke Sensor", ModelCode = "S1", Description = "A" };

            var asset = new EquipmentAsset
            {
                Id = "asset_3d",
                CustomerId = "cust_1",
                ModelId = "model_1",
                SerialNumber = "SN-3D",
                Status = AssetStatus.Installed,
                NextMaintenanceDate = DateTime.UtcNow.AddDays(3)
            };

            await context.Customers.AddAsync(customer);
            await context.EquipmentModels.AddAsync(model);
            await context.EquipmentAssets.AddAsync(asset);
            await context.SaveChangesAsync();

            // Act - Run 1
            await service.RunDailyScanAsync();
            var count1 = await context.MaintenanceReminders.CountAsync();

            // Act - Run 2 (simulate running again later or in parallel)
            await service.RunDailyScanAsync();
            var count2 = await context.MaintenanceReminders.CountAsync();

            // Assert
            Assert.Equal(1, count1);
            Assert.Equal(1, count2); // Idempotency check works!
        }

        [Fact]
        public async Task Test_CustomerResponse_Accepted_TransitionsToAwaitingDispatch()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEmail = new Mock<IEmailService>();
            var service = new MaintenanceReminderService(context, mockEmail.Object);

            var draftRequest = new ServiceRequest
            {
                RequestNumber = "SR-M",
                CustomerId = "c",
                AddressId = "a",
                Status = ServiceRequestStatus.Created
            };

            var reminder = new MaintenanceReminder
            {
                EquipmentAssetId = "asset_id",
                ReminderType = "7Days",
                ScheduledDate = DateTime.UtcNow.AddDays(7),
                Status = ReminderStatus.Proposed,
                AssociatedServiceRequest = draftRequest
            };

            await context.ServiceRequests.AddAsync(draftRequest);
            await context.MaintenanceReminders.AddAsync(reminder);
            await context.SaveChangesAsync();

            // Act
            var success = await service.RespondToReminderAsync(reminder.Id, ReminderStatus.Accepted, null);

            // Assert
            Assert.True(success);
            
            var updatedReminder = await context.MaintenanceReminders.FindAsync(reminder.Id);
            Assert.Equal(ReminderStatus.Accepted, updatedReminder!.Status);
            
            var updatedRequest = await context.ServiceRequests.FindAsync(draftRequest.Id);
            Assert.Equal(ServiceRequestStatus.AwaitingDispatch, updatedRequest!.Status);
        }

        [Fact]
        public async Task Test_CustomerResponse_Declined_CancelsDraftRequest()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEmail = new Mock<IEmailService>();
            var service = new MaintenanceReminderService(context, mockEmail.Object);

            var draftRequest = new ServiceRequest
            {
                RequestNumber = "SR-M2",
                CustomerId = "c",
                AddressId = "a",
                Status = ServiceRequestStatus.Created
            };

            var reminder = new MaintenanceReminder
            {
                EquipmentAssetId = "asset_id",
                ReminderType = "7Days",
                ScheduledDate = DateTime.UtcNow.AddDays(7),
                Status = ReminderStatus.Proposed,
                AssociatedServiceRequest = draftRequest
            };

            await context.ServiceRequests.AddAsync(draftRequest);
            await context.MaintenanceReminders.AddAsync(reminder);
            await context.SaveChangesAsync();

            // Act
            var success = await service.RespondToReminderAsync(reminder.Id, ReminderStatus.Declined, "Khách hàng bận đi du lịch");

            // Assert
            Assert.True(success);
            
            var updatedReminder = await context.MaintenanceReminders.FindAsync(reminder.Id);
            Assert.Equal(ReminderStatus.Declined, updatedReminder!.Status);
            Assert.Equal("Khách hàng bận đi du lịch", updatedReminder.DeclineReason);
            
            var updatedRequest = await context.ServiceRequests.FindAsync(draftRequest.Id);
            Assert.Equal(ServiceRequestStatus.Cancelled, updatedRequest!.Status);
        }
    }
}
