using System.Text;
using System.Text.Json.Serialization;
using FireGuard.API.Authorization;
using FireGuard.API.Middlewares;
using FireGuard.API.Services;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Infrastructure;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FireGuard.API.Hubs;
using Serilog;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Hangfire;

var builder = WebApplication.CreateBuilder(args);

// Add SignalR support
builder.Services.AddSignalR();

// Configure Serilog from appsettings
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddMemoryCache();

// Configure CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCors", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow any localhost origin (3000, 3001, 5173, etc.)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("ApiLimiter", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 10;
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
    });
});

// Register Clean Architecture Layers
builder.Services.AddInfrastructureServices(builder.Configuration);

// Context Accessors
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IFireGuardEventService, FireGuardEventService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Configure JWT Authentication
var secretKey = builder.Configuration["Jwt:Secret"] ?? "super_secret_jwt_key_with_at_least_32_characters_123456";
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in Production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // Remove delay of token when expire
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Custom Permission Authorization Services
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();

// Swagger Configuration with JWT authorization support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FireGuard AI ERP API",
        Version = "v1",
        Description = "Core ERP API for FireGuard AI system"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Built-in Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

var app = builder.Build();

// Auto-run Migrations and Database Seeding at Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        bool tablesExist = false;
        try
        {
            tablesExist = await context.Users.AnyAsync();
        }
        catch (Exception)
        {
            tablesExist = false;
        }

        if (!tablesExist)
        {
            var script = context.Database.GenerateCreateScript();
            if (!string.IsNullOrWhiteSpace(script))
            {
                var batches = script.Split(';', StringSplitOptions.RemoveEmptyEntries);
                foreach (var batch in batches)
                {
                    var sql = batch.Trim();
                    if (!string.IsNullOrWhiteSpace(sql))
                    {
                        try
                        {
                            await context.Database.ExecuteSqlRawAsync(sql);
                        }
                        catch (Exception)
                        {
                            // Ignore if table or constraint already exists
                        }
                    }
                }
            }
        }
        await ApplicationDbContextSeed.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration or seeding.");
    }
}

// Configure Security Headers Middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "no-referrer");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none';");
    await next();
});

// Configure CORS
app.UseCors("DefaultCors");

// Configure Rate Limiting
app.UseRateLimiter();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FireGuard AI ERP API v1");
    c.RoutePrefix = "swagger";
});

// Global Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

if (!app.Environment.IsDevelopment() && !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("USE_HTTPS")))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

// Hangfire Dashboard configuration
app.UseHangfireDashboard("/hangfire");

// Register Daily Recurring Job for Maintenance Scan
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    recurringJobManager.AddOrUpdate<IMaintenanceReminderService>(
        "daily-equipment-maintenance-scan",
        s => s.RunDailyScanAsync(),
        Cron.Daily
    );

    // Register Monthly Recurring Job for Technician KPI Calculations
    recurringJobManager.AddOrUpdate<ITechnicianKpiService>(
        "monthly-technician-kpi-calculation",
        s => s.CalculateMonthlyKpiAsync(DateTime.UtcNow.Year, DateTime.UtcNow.Month),
        Cron.Monthly
    );
}

// Map Endpoints
app.MapControllers();
app.MapHub<ProjectHub>("/hubs/project");
app.MapHub<FireGuardHub>("/hubs/fireguard");
app.MapHealthChecks("/health");

try
{
    Log.Information("Starting FireGuard Core API host...");
    app.Run();
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}
