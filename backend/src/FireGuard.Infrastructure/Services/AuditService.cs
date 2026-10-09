using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class AuditService : IAuditService
    {
        private readonly ApplicationDbContext _context;

        public AuditService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(
            string? operatorName,
            string action,
            string module,
            string? entityName,
            string? entityId,
            object? before,
            object? after,
            string? ipAddress,
            string? userAgent,
            string? correlationId,
            bool isSuccess = true,
            string? errorMessage = null)
        {
            var audit = new AuditLog
            {
                Operator = operatorName ?? "System",
                Action = action,
                Module = module,
                EntityName = entityName,
                EntityId = entityId,
                BeforeValues = SerializeAndMask(before),
                AfterValues = SerializeAndMask(after),
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CorrelationId = correlationId ?? Guid.NewGuid().ToString(),
                IsSuccess = isSuccess,
                ErrorMessage = errorMessage
            };

            await _context.AuditLogs.AddAsync(audit);
            await _context.SaveChangesAsync();
        }

        public async Task PurgeOldLogsAsync(int retentionDays)
        {
            var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
            var logsToRemove = await _context.AuditLogs
                .Where(l => l.TimestampUtc < cutoff)
                .ToListAsync();

            if (logsToRemove.Any())
            {
                _context.AuditLogs.RemoveRange(logsToRemove);
                await _context.SaveChangesAsync();
            }
        }

        private string? SerializeAndMask(object? obj)
        {
            if (obj == null) return null;
            if (obj is string str) return str;

            try
            {
                var options = new JsonSerializerOptions
                {
                    WriteIndented = false
                };

                string json = JsonSerializer.Serialize(obj, options);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var sanitized = SanitizeJsonElement(root);
                return JsonSerializer.Serialize(sanitized, options);
            }
            catch (Exception ex)
            {
                return $"[Serialization Error: {ex.Message}]";
            }
        }

        private object? SanitizeJsonElement(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                var dict = new Dictionary<string, object?>();
                foreach (var prop in element.EnumerateObject())
                {
                    var key = prop.Name.ToLower();
                    if (key.Contains("password") || key.Contains("token") || key.Contains("secret") || key.Contains("key"))
                    {
                        dict[prop.Name] = "[REDACTED_SENSITIVE_DATA]";
                    }
                    else if (key.Contains("image") || key.Contains("file") || key.Contains("bytes") || key.Contains("binary"))
                    {
                        dict[prop.Name] = "[BINARY_DATA_REMOVED]";
                    }
                    else
                    {
                        dict[prop.Name] = SanitizeJsonElement(prop.Value);
                    }
                }
                return dict;
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(SanitizeJsonElement(item));
                }
                return list;
            }

            switch (element.ValueKind)
            {
                case JsonValueKind.String:
                    return element.GetString();
                case JsonValueKind.Number:
                    if (element.TryGetInt64(out long l)) return l;
                    if (element.TryGetDouble(out double d)) return d;
                    return element.GetRawText();
                case JsonValueKind.True:
                    return true;
                case JsonValueKind.False:
                    return false;
                case JsonValueKind.Null:
                    return null;
                default:
                    return element.GetRawText();
            }
        }
    }
}
