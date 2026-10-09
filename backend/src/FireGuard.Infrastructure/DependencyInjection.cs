using System;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Infrastructure.Identity;
using FireGuard.Infrastructure.Persistence;
using Hangfire;
using Hangfire.MySql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FireGuard.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                                   ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                options.UseMySql(
                    connectionString,
                    ServerVersion.AutoDetect(connectionString),
                    builder => builder.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
                );
            });

            // Register Identity Services
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IIdentityService, IdentityService>();

            // Register File Storage Service
            services.AddSingleton<IFileStorageService, Services.MinioFileStorageService>();

            // Register Email Service
            services.AddTransient<IEmailService, Services.EmailService>();

            // Register AI Service client
            services.AddHttpClient<IAIService, Services.AIService>();

            // Register Dispatch Scoring Service
            services.AddScoped<IDispatchScoringService, Services.DispatchScoringService>();

            // Register Dispatch Orchestration Service
            services.AddScoped<IDispatchOrchestrationService, Services.DispatchOrchestrationService>();

            // Register Maintenance Reminder Service
            services.AddScoped<IMaintenanceReminderService, Services.MaintenanceReminderService>();

            // Register Technician KPI Service
            services.AddScoped<ITechnicianKpiService, Services.TechnicianKpiService>();

            // Register Google Maps Service
            services.AddHttpClient<IGoogleMapsService, Services.GoogleMapsService>();

            // Register Admin Dashboard Service
            services.AddScoped<IDashboardService, Services.DashboardService>();

            // Register Report Generation Service
            services.AddScoped<IReportService, Services.ReportService>();

            // Register Security Audit Log Service
            services.AddScoped<IAuditService, Services.AuditService>();

            // Configure Hangfire with MySql Storage
            services.AddHangfire(config => config
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseStorage(new MySqlStorage(connectionString, new MySqlStorageOptions
                {
                    QueuePollInterval = TimeSpan.FromSeconds(15),
                    JobExpirationCheckInterval = TimeSpan.FromHours(1),
                    CountersAggregateInterval = TimeSpan.FromMinutes(5),
                    PrepareSchemaIfNecessary = true,
                    DashboardJobListLimit = 50000,
                    TransactionTimeout = TimeSpan.FromMinutes(1),
                    TablesPrefix = "Hangfire_"
                })));

            // Run Hangfire server
            services.AddHangfireServer();

            return services;
        }
    }
}
