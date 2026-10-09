using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class DispatchScoringServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            
            return new ApplicationDbContext(options);
        }

        [Fact]
        public async Task Test_Exclusion_NotOnDuty_ShouldBeExcluded()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new DispatchScoringService(context);

            var address = new CustomerAddress { AddressLine = "Test", Latitude = 10.0, Longitude = 10.0 };
            var customer = new Customer { Name = "Customer A", Email = "a@a.com", Phone = "123" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-1",
                Customer = customer,
                Address = address,
                Description = "Sửa máy bơm chữa cháy bị hỏng", // Requires "Pumps" skill
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            // Technician: Off Duty
            var tech = new User
            {
                Username = "tech1",
                Email = "tech1@fireguard.com",
                FullName = "Off Duty Tech",
                IsTechnician = true,
                IsOnDuty = false, // OFF DUTY
                IsOnLeave = false,
                Skills = "Pumps",
                Latitude = 10.005, // 0.5km away
                Longitude = 10.005
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // Act
            var recommendation = await service.GenerateRecommendationAsync(request.Id);

            // Assert
            Assert.Empty(recommendation.TechnicianScores);
        }

        [Fact]
        public async Task Test_Exclusion_OnLeave_ShouldBeExcluded()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new DispatchScoringService(context);

            var address = new CustomerAddress { AddressLine = "Test", Latitude = 10.0, Longitude = 10.0 };
            var customer = new Customer { Name = "Customer A", Email = "a@a.com", Phone = "123" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-2",
                Customer = customer,
                Address = address,
                Description = "Sửa máy bơm chữa cháy bị hỏng",
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            // Technician: On Leave
            var tech = new User
            {
                Username = "tech2",
                Email = "tech2@fireguard.com",
                FullName = "On Leave Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = true, // ON LEAVE
                Skills = "Pumps",
                Latitude = 10.005,
                Longitude = 10.005
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // Act
            var recommendation = await service.GenerateRecommendationAsync(request.Id);

            // Assert
            Assert.Empty(recommendation.TechnicianScores);
        }

        [Fact]
        public async Task Test_Exclusion_MissingMandatorySkills_ShouldBeExcluded()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new DispatchScoringService(context);

            var address = new CustomerAddress { AddressLine = "Test", Latitude = 10.0, Longitude = 10.0 };
            var customer = new Customer { Name = "Customer A", Email = "a@a.com", Phone = "123" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-3",
                Customer = customer,
                Address = address,
                Description = "Lắp đầu phun sprinkler", // Requires "Sprinklers" skill
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            // Technician lacks "Sprinklers" skill
            var tech = new User
            {
                Username = "tech3",
                Email = "tech3@fireguard.com",
                FullName = "Alarm Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false,
                Skills = "Alarms", // Lacks Sprinklers
                Latitude = 10.005,
                Longitude = 10.005
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // Act
            var recommendation = await service.GenerateRecommendationAsync(request.Id);

            // Assert
            Assert.Empty(recommendation.TechnicianScores);
        }

        [Fact]
        public async Task Test_Exclusion_TooFar_ShouldBeExcluded()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new DispatchScoringService(context);

            var address = new CustomerAddress { AddressLine = "Test", Latitude = 10.0, Longitude = 10.0 };
            var customer = new Customer { Name = "Customer A", Email = "a@a.com", Phone = "123" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-4",
                Customer = customer,
                Address = address,
                Description = "Bảo trì tủ báo cháy Alarms",
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            // Technician is ~111km away (1 degree of latitude is approx 111km)
            var tech = new User
            {
                Username = "tech4",
                Email = "tech4@fireguard.com",
                FullName = "Far Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false,
                Skills = "Alarms",
                Latitude = 11.0, // 1 degree north
                Longitude = 10.0
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // Act
            var recommendation = await service.GenerateRecommendationAsync(request.Id, maxDistanceKm: 30.0);

            // Assert
            Assert.Empty(recommendation.TechnicianScores);
        }

        [Fact]
        public async Task Test_Scoring_Distance_CloserTechScoresHigher()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var service = new DispatchScoringService(context);

            var address = new CustomerAddress { AddressLine = "Test", Latitude = 10.0, Longitude = 10.0 };
            var customer = new Customer { Name = "Customer A", Email = "a@a.com", Phone = "123" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-5",
                Customer = customer,
                Address = address,
                Description = "Bảo trì tủ báo cháy Alarms",
                Status = ServiceRequestStatus.AwaitingDispatch
            };

            // Close Tech (0.5km away)
            var closeTech = new User
            {
                Username = "tech_close",
                Email = "close@fireguard.com",
                FullName = "Close Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false,
                Skills = "Alarms",
                Latitude = 10.003,
                Longitude = 10.003
            };

            // Far Tech (15km away)
            var farTech = new User
            {
                Username = "tech_far",
                Email = "far@fireguard.com",
                FullName = "Far Tech",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false,
                Skills = "Alarms",
                Latitude = 10.1,
                Longitude = 10.1
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddRangeAsync(closeTech, farTech);
            await context.SaveChangesAsync();

            // Act
            var recommendation = await service.GenerateRecommendationAsync(request.Id, maxDistanceKm: 30.0);

            // Assert
            var closeScore = recommendation.TechnicianScores.First(s => s.TechnicianId == closeTech.Id);
            var farScore = recommendation.TechnicianScores.First(s => s.TechnicianId == farTech.Id);

            Assert.True(closeScore.DistanceScore > farScore.DistanceScore);
            Assert.True(closeScore.TotalScore > farScore.TotalScore);
        }
    }
}
