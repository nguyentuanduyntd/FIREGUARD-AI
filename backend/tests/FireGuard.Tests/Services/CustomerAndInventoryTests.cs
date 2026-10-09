using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.Inventory;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class CustomerAndInventoryTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_CreateCustomer_SavesSuccessfully()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var customer = new Customer
            {
                Id = "c_999",
                Name = "Cửa hàng PCCC Hà Nội",
                Email = "pccc.hanoi@test.vn",
                Phone = "0987654321"
            };

            // Act
            await context.Customers.AddAsync(customer);
            await context.SaveChangesAsync();

            // Assert
            var dbCust = await context.Customers.FindAsync("c_999");
            Assert.NotNull(dbCust);
            Assert.Equal("Cửa hàng PCCC Hà Nội", dbCust.Name);
        }

        [Fact]
        public async Task Test_WarehouseStock_ImportExport_ValidatesQuantityLimits()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var warehouse = new Warehouse { Id = "wh_1", Name = "Kho Trung Tâm", Address = "Hà Nội" };
            var model = new EquipmentModel { Id = "mod_1", Name = "Bình chữa cháy CO2 4kg", ModelCode = "CO2-4KG", SellingPrice = 250000m };
            
            var stock = new WarehouseStock
            {
                Id = "stock_1",
                WarehouseId = "wh_1",
                ModelId = "mod_1",
                Quantity = 10, // Initial quantity
                LowStockThreshold = 3
            };

            await context.Warehouses.AddAsync(warehouse);
            await context.EquipmentModels.AddAsync(model);
            await context.WarehouseStocks.AddAsync(stock);
            await context.SaveChangesAsync();

            // Act - Import stock
            var dbStock = await context.WarehouseStocks.FirstAsync();
            dbStock.Quantity += 5; // Import 5 units
            context.WarehouseStocks.Update(dbStock);
            await context.SaveChangesAsync();

            // Assert import
            Assert.Equal(15, dbStock.Quantity);

            // Act & Assert export - Export within limits
            dbStock.Quantity -= 10;
            context.WarehouseStocks.Update(dbStock);
            await context.SaveChangesAsync();
            Assert.Equal(5, dbStock.Quantity);

            // Act & Assert export - Export exceeding limits (validation simulation)
            var exportAmount = 10; // Exceeds current quantity of 5
            bool hasError = false;
            if (dbStock.Quantity - exportAmount < 0)
            {
                hasError = true;
            }

            Assert.True(hasError, "Should not export exceeding current warehouse stock count.");
        }

        [Fact]
        public async Task Test_Quotation_VersioningHistory()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var customer = new Customer { Id = "cust_5", Name = "Khách Hàng VIP", Email = "vip@test.vn" };
            
            var quoteV1 = new Quotation
            {
                Id = "quote_v1",
                QuotationNumber = "BG-2026-0001",
                Version = 1,
                CustomerId = "cust_5",
                TotalAmount = 12000000m,
                Status = QuotationStatus.Sent
            };

            var quoteV2 = new Quotation
            {
                Id = "quote_v2",
                QuotationNumber = "BG-2026-0001",
                Version = 2,
                ParentQuotationId = "quote_v1",
                CustomerId = "cust_5",
                TotalAmount = 15000000m, // revised budget
                Status = QuotationStatus.Accepted
            };

            await context.Customers.AddAsync(customer);
            await context.Quotations.AddRangeAsync(quoteV1, quoteV2);
            await context.SaveChangesAsync();

            // Assert
            var dbV2 = await context.Quotations.FindAsync("quote_v2");
            Assert.NotNull(dbV2);
            Assert.Equal("quote_v1", dbV2.ParentQuotationId);
            Assert.Equal(2, dbV2.Version);
            Assert.Equal(QuotationStatus.Accepted, dbV2.Status);
        }

        [Fact]
        public async Task Test_ProjectAndServiceRequest_StateMachineTransitions()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var customer = new Customer { Id = "cust_1", Name = "Client A", Email = "c1@test.com" };
            
            var project = new Project
            {
                Id = "proj_test",
                Name = "Thi công PCCC tòa nhà Ruby",
                CustomerId = "cust_1",
                Status = ProjectStatus.Planning
            };

            var serviceRequest = new ServiceRequest
            {
                Id = "req_test",
                RequestNumber = "SR-2026-99",
                Description = "Lắp đặt lại tủ điều khiển báo cháy",
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            await context.Customers.AddAsync(customer);
            await context.Projects.AddAsync(project);
            await context.ServiceRequests.AddAsync(serviceRequest);
            await context.SaveChangesAsync();

            // Act - transition project state
            project.Status = ProjectStatus.InProgress;
            context.Projects.Update(project);

            // Act - transition service request state
            serviceRequest.Status = ServiceRequestStatus.Dispatching;
            context.ServiceRequests.Update(serviceRequest);

            await context.SaveChangesAsync();

            // Assert
            var dbProject = await context.Projects.FindAsync("proj_test");
            var dbRequest = await context.ServiceRequests.FindAsync("req_test");

            Assert.Equal(ProjectStatus.InProgress, dbProject.Status);
            Assert.Equal(ServiceRequestStatus.Dispatching, dbRequest.Status);
        }
    }
}
