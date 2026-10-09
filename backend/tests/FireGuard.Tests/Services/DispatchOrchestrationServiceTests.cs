using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.API.Hubs;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using FireGuard.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace FireGuard.Tests.Services
{
    public class DispatchOrchestrationServiceTests
    {
        private ApplicationDbContext GetInMemoryContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            
            return new ApplicationDbContext(options);
        }

        private Mock<IFireGuardEventService> GetMockEventService()
        {
            return new Mock<IFireGuardEventService>();
        }

        [Fact]
        public async Task Test_AcceptOffer_Success_ShouldAssignTechnician()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEventService = GetMockEventService();
            var mockScoring = new Mock<IDispatchScoringService>();
            var orchestrator = new DispatchOrchestrationService(context, mockScoring.Object, mockEventService.Object);

            var address = new CustomerAddress { AddressLine = "Address", Latitude = 10, Longitude = 10 };
            var customer = new Customer { Name = "Customer", Email = "c@c.com", Phone = "1" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-100",
                Customer = customer,
                Address = address,
                Description = "Sửa điện",
                Status = ServiceRequestStatus.Dispatching,
                CurrentOfferedTechnicianId = "tech_1",
                OfferExpiresAtUtc = DateTime.UtcNow.AddMinutes(2),
                CurrentOfferAttemptIndex = 0
            };

            var tech = new User
            {
                Id = "tech_1",
                Username = "tech1",
                Email = "t1@t.com",
                FullName = "Tech One",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddAsync(tech);
            await context.SaveChangesAsync();

            // Act
            var accepted = await orchestrator.AcceptOfferAsync(request.Id, "tech_1");

            // Assert
            Assert.True(accepted);
            
            var updatedRequest = await context.ServiceRequests.FindAsync(request.Id);
            Assert.NotNull(updatedRequest);
            Assert.Equal(ServiceRequestStatus.TechnicianAccepted, updatedRequest.Status);
            Assert.Equal("tech_1", updatedRequest.AssignedTechnicianId);
            Assert.Null(updatedRequest.CurrentOfferedTechnicianId);
        }

        [Fact]
        public async Task Test_AcceptOffer_RaceCondition_DoubleAssignment_Fails()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEventService = GetMockEventService();
            var mockScoring = new Mock<IDispatchScoringService>();
            var orchestrator = new DispatchOrchestrationService(context, mockScoring.Object, mockEventService.Object);

            var address = new CustomerAddress { AddressLine = "Address", Latitude = 10, Longitude = 10 };
            var customer = new Customer { Name = "Customer", Email = "c@c.com", Phone = "1" };
            
            var request = new ServiceRequest
            {
                RequestNumber = "SR-200",
                Customer = customer,
                Address = address,
                Description = "Sửa hệ thống báo cháy",
                Status = ServiceRequestStatus.Dispatching,
                CurrentOfferedTechnicianId = "tech_1", // Currently offered to Tech 1
                OfferExpiresAtUtc = DateTime.UtcNow.AddMinutes(2),
                CurrentOfferAttemptIndex = 0
            };

            var tech1 = new User
            {
                Id = "tech_1",
                Username = "tech1",
                Email = "t1@t.com",
                FullName = "Tech One",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false
            };

            var tech2 = new User
            {
                Id = "tech_2",
                Username = "tech2",
                Email = "t2@t.com",
                FullName = "Tech Two",
                IsTechnician = true,
                IsOnDuty = true,
                IsOnLeave = false
            };

            await context.ServiceRequests.AddAsync(request);
            await context.Users.AddRangeAsync(tech1, tech2);
            await context.SaveChangesAsync();

            // Act & Assert
            // 1. Tech 1 accepts the offer (Happy path)
            var accepted1 = await orchestrator.AcceptOfferAsync(request.Id, "tech_1");
            Assert.True(accepted1);

            // 2. Tech 2 tries to accept the same offer concurrently (should fail immediately)
            var accepted2 = await orchestrator.AcceptOfferAsync(request.Id, "tech_2");
            Assert.False(accepted2); // Blocked because status is no longer Dispatching and OfferedTechnician doesn't match!

            // 3. Tech 1 tries to accept again (should return false since state is no longer Dispatching)
            var acceptedAgain = await orchestrator.AcceptOfferAsync(request.Id, "tech_1");
            Assert.False(acceptedAgain);
        }

        [Fact]
        public async Task Test_Timeout_ProgressesToNextCandidate()
        {
            // Arrange
            using var context = GetInMemoryContext(Guid.NewGuid().ToString());
            var mockEventService = GetMockEventService();
            var mockScoring = new Mock<IDispatchScoringService>();
            var orchestrator = new DispatchOrchestrationService(context, mockScoring.Object, mockEventService.Object);

            var address = new CustomerAddress { AddressLine = "Address", Latitude = 10, Longitude = 10 };
            var customer = new Customer { Name = "Customer", Email = "c@c.com", Phone = "1" };
            
            var recommendation = new ServiceRequestDispatch
            {
                DistanceWeight = 0.25,
                SkillWeight = 0.25,
                AvailabilityWeight = 0.15,
                RatingWeight = 0.10,
                WorkloadWeight = 0.10,
                FirstTimeFixWeight = 0.10,
                AcceptanceWeight = 0.05,
                TechnicianScores = new List<TechnicianDispatchScore>
                {
                    new TechnicianDispatchScore { TechnicianId = "tech_1", TechnicianName = "Tech 1", TotalScore = 90, ScoreBreakdownJson = "{}", RankingExplanation = "Rank 1" },
                    new TechnicianDispatchScore { TechnicianId = "tech_2", TechnicianName = "Tech 2", TotalScore = 80, ScoreBreakdownJson = "{}", RankingExplanation = "Rank 2" }
                }
            };

            var request = new ServiceRequest
            {
                RequestNumber = "SR-300",
                Customer = customer,
                Address = address,
                Description = "Sửa hệ thống báo cháy",
                Status = ServiceRequestStatus.Dispatching,
                CurrentOfferedTechnicianId = "tech_1",
                OfferExpiresAtUtc = DateTime.UtcNow.AddSeconds(-5), // ALREADY EXPIRED
                CurrentOfferAttemptIndex = 0,
                DispatchRecommendationId = recommendation.Id
            };

            await context.ServiceRequests.AddAsync(request);
            await context.ServiceRequestDispatches.AddAsync(recommendation);
            await context.SaveChangesAsync();

            // Act
            await orchestrator.EvaluateOfferTimeoutAsync(request.Id, "tech_1", 0);

            // Assert
            var updatedRequest = await context.ServiceRequests.FindAsync(request.Id);
            Assert.NotNull(updatedRequest);
            Assert.Equal(ServiceRequestStatus.Dispatching, updatedRequest.Status);
            Assert.Equal("tech_2", updatedRequest.CurrentOfferedTechnicianId); // Moved to Tech 2!
            Assert.Equal(1, updatedRequest.CurrentOfferAttemptIndex);
        }
    }
}
