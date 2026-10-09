using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AIController(IAIService aiService, ApplicationDbContext context, ICurrentUserService currentUserService)
        {
            _aiService = aiService;
            _context = context;
            _currentUserService = currentUserService;
        }

        private static readonly Dictionary<string, (string AltCode, string Name, decimal Price)> DefaultCatalog = new(StringComparer.OrdinalIgnoreCase)
        {
            ["EXT-ABC-4KG"] = ("BCC-MFZ4", "Bình chữa cháy bột ABC 4kg MFZL4", 250000m),
            ["BCC-MFZ4"] = ("EXT-ABC-4KG", "Bình chữa cháy bột ABC 4kg MFZL4", 250000m),
            ["EXT-CO2-3KG"] = ("BCC-MT3", "Bình chữa cháy khí CO2 3kg MT3", 380000m),
            ["BCC-MT3"] = ("EXT-CO2-3KG", "Bình chữa cháy khí CO2 3kg MT3", 380000m),
            ["EXT-ABC-8KG"] = ("BCC-MFZ8", "Bình chữa cháy bột ABC 8kg MFZL8", 350000m),
            ["BCC-MFZ8"] = ("EXT-ABC-8KG", "Bình chữa cháy bột ABC 8kg MFZL8", 350000m),
            ["EXT-CO2-5KG"] = ("BCC-MT5", "Bình chữa cháy khí CO2 5kg MT5", 520000m),
            ["BCC-MT5"] = ("EXT-CO2-5KG", "Bình chữa cháy khí CO2 5kg MT5", 520000m),
            ["DET-SMOKE-WIRE"] = ("DB-KHOI", "Đầu báo khói quang học Hochiki SOC-24VN", 450000m),
            ["DB-KHOI"] = ("DET-SMOKE-WIRE", "Đầu báo khói quang học Hochiki SOC-24VN", 450000m),
            ["DET-HEAT-WIRE"] = ("DB-NHIET", "Đầu báo nhiệt gia tăng Hochiki DSC-EA", 280000m),
            ["DB-NHIET"] = ("DET-HEAT-WIRE", "Đầu báo nhiệt gia tăng Hochiki DSC-EA", 280000m),
            ["ALM-PANEL-8"] = ("TCC-8ZONE", "Tủ trung tâm báo cháy 8 kênh Hochiki", 5800000m),
            ["TCC-8ZONE"] = ("ALM-PANEL-8", "Tủ trung tâm báo cháy 8 kênh Hochiki", 5800000m),
            ["ALM-PANEL-4"] = ("TCC-4ZONE", "Tủ trung tâm báo cháy 4 kênh Hochiki", 4200000m),
            ["TCC-4ZONE"] = ("ALM-PANEL-4", "Tủ trung tâm báo cháy 4 kênh Hochiki", 4200000m),
            ["ALM-BELL"] = ("CHUONG-BAO", "Chuông báo cháy 6 inch 24VDC Hochiki", 320000m),
            ["CHUONG-BAO"] = ("ALM-BELL", "Chuông báo cháy 6 inch 24VDC Hochiki", 320000m),
            ["ALM-BUTTON"] = ("", "Nút nhấn báo cháy khẩn cấp Hochiki", 180000m),
            ["DEN-EXIT"] = ("", "Đèn chỉ dẫn thoát hiểm (EXIT) 2 mặt", 150000m),
            ["DEN-SCS"] = ("", "Đèn sự cố mắt ếch kép", 220000m),
            ["SPK-NOZZLE-68"] = ("", "Đầu phun Sprinkler quay xuống 68°C", 85000m),
            ["PIPE-STEEL-DN50"] = ("", "Ống thép dẫn nước chữa cháy DN50 (mét)", 160000m),
            ["VOI-CC-D50"] = ("", "Vòi chữa cháy D50 dài 20m", 450000m),
            ["LANG-CC"] = ("", "Lăng phun chữa cháy D50", 80000m)
        };

        private async Task<(string? ModelId, string Name, decimal Price)> ResolveEquipmentAsync(string itemCode)
        {
            var altCode = DefaultCatalog.TryGetValue(itemCode, out var info) ? info.AltCode : null;

            var dbModel = await _context.EquipmentModels
                .FirstOrDefaultAsync(m => m.ModelCode == itemCode || (!string.IsNullOrEmpty(altCode) && m.ModelCode == altCode));

            if (dbModel != null)
            {
                return (dbModel.Id, dbModel.Name, dbModel.SellingPrice);
            }

            if (!string.IsNullOrEmpty(info.Name))
            {
                return (null, info.Name, info.Price);
            }

            return (null, $"Thiết bị PCCC ({itemCode})", 250000m);
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] JsonElement requestBody)
        {
            var jsonResponse = await _aiService.ChatAsync(requestBody);
            
            try
            {
                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };
                var chatResponse = JsonSerializer.Deserialize<ChatResponseDto>(jsonResponse, options);

                if (chatResponse != null && chatResponse.SuggestedEquipment != null)
                {
                    foreach (var item in chatResponse.SuggestedEquipment)
                    {
                        var resolved = await ResolveEquipmentAsync(item.ItemCode);
                        item.Name = resolved.Name;
                        item.Price = resolved.Price;
                    }

                    return Ok(chatResponse);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error enriching chatbot response: {ex.Message}");
            }

            return Content(jsonResponse, "application/json");
        }

        [HttpPost("quotation/suggest")]
        public async Task<IActionResult> SuggestQuotation([FromBody] JsonElement requestBody)
        {
            var jsonResponse = await _aiService.SuggestQuotationAsync(requestBody);
            
            try
            {
                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };
                var responseDto = JsonSerializer.Deserialize<QuotationSuggestResponseDto>(jsonResponse, options);

                if (responseDto != null && responseDto.SuggestedItems != null)
                {
                    decimal totalEquipmentCost = 0;

                    foreach (var item in responseDto.SuggestedItems)
                    {
                        var resolved = await ResolveEquipmentAsync(item.ItemCode);
                        item.ModelId = resolved.ModelId;
                        item.Name = resolved.Name;
                        item.UnitPrice = resolved.Price;
                        item.TotalPrice = resolved.Price * item.Quantity;
                        totalEquipmentCost += item.TotalPrice.Value;
                    }

                    // 1. Total hardware equipment cost
                    responseDto.EquipmentCost = totalEquipmentCost;

                    // 2. Auxiliary materials & cabling (12% of hardware, minimum 300,000 VND)
                    decimal auxiliaryCost = Math.Max(300000m, Math.Round(totalEquipmentCost * 0.12m, 0));

                    // 3. Physical installation labor & central panel programming (20% of hardware, minimum 1,200,000 VND)
                    decimal laborCost = Math.Max(1200000m, Math.Round(totalEquipmentCost * 0.20m, 0));

                    responseDto.InstallationCost = laborCost + auxiliaryCost; 
                    responseDto.SurveyCost = 500000; // Onsite survey & TCVN engineering drawing report fee
                    
                    var grandTotal = responseDto.EquipmentCost + responseDto.InstallationCost + responseDto.SurveyCost;
                    responseDto.MinPriceRange = Math.Round(grandTotal * 0.92m, 0); 
                    responseDto.MaxPriceRange = Math.Round(grandTotal * 1.15m, 0); 

                    return Ok(responseDto);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error enriching quotation suggest: {ex.Message}");
            }

            return Content(jsonResponse, "application/json");
        }

        [HttpPost("diagnosis")]
        public async Task<IActionResult> DiagnoseFault([FromBody] DiagnosisRequestDto request)
        {
            // Call FastAPI to get AI diagnosis details
            var jsonPayload = JsonSerializer.Serialize(new
            {
                equipment_model = request.EquipmentModel,
                equipment_age = request.EquipmentAge,
                symptoms = request.Symptoms,
                repair_history = request.RepairHistory ?? "",
                last_maintenance = request.LastMaintenance ?? "",
                error_code = request.ErrorCode ?? "",
                image_url = request.ImageUrl ?? ""
            });

            using var document = JsonDocument.Parse(jsonPayload);
            var jsonResponse = await _aiService.DiagnoseFaultAsync(document.RootElement);

            try
            {
                string? createdLogId = null;
                try
                {
                    // Save log to database
                    var log = new AIDiagnosisLog
                    {
                        EquipmentModel = request.EquipmentModel,
                        EquipmentAge = request.EquipmentAge,
                        Symptoms = request.Symptoms,
                        RepairHistory = request.RepairHistory,
                        LastMaintenance = request.LastMaintenance,
                        ErrorCode = request.ErrorCode,
                        ImageUrl = request.ImageUrl,
                        AIResponseJson = jsonResponse
                    };

                    await _context.AIDiagnosisLogs.AddAsync(log);
                    await _context.SaveChangesAsync();
                    createdLogId = log.Id;
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"Warning: Could not save diagnosis log to DB: {dbEx.Message}");
                }

                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                };
                var responseData = JsonSerializer.Deserialize<DiagnosisResponseDto>(jsonResponse, options);

                return Ok(new DiagnosisResultWrapperDto
                {
                    LogId = createdLogId,
                    Diagnosis = responseData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing diagnosis response: {ex.Message}");
            }

            return Content(jsonResponse, "application/json");
        }

        [HttpPost("diagnosis/{id}/feedback")]
        public async Task<IActionResult> SubmitFeedback(string id, [FromBody] DiagnosisFeedbackRequestDto request)
        {
            var log = await _context.AIDiagnosisLogs.FindAsync(id);
            if (log == null)
            {
                return NotFound(new { Message = "Diagnosis log not found." });
            }

            log.IsCorrect = request.IsCorrect;
            log.TechnicianFeedback = request.TechnicianFeedback;
            log.EvaluatedByUserId = _currentUserService.Username ?? "Technician";
            log.EvaluatedAtUtc = DateTime.UtcNow;

            _context.AIDiagnosisLogs.Update(log);
            await _context.SaveChangesAsync();

            return Ok(new { Succeeded = true, Message = "Feedback logged successfully." });
        }

        [HttpPost("dispatch/rank")]
        public async Task<IActionResult> RankDispatch([FromBody] JsonElement requestBody)
        {
            var jsonResponse = await _aiService.RankDispatchAsync(requestBody);
            return Content(jsonResponse, "application/json");
        }

        [HttpPost("kpi/calculate")]
        public async Task<IActionResult> CalculateKPI([FromBody] JsonElement requestBody)
        {
            var jsonResponse = await _aiService.CalculateKPIAsync(requestBody);
            return Content(jsonResponse, "application/json");
        }
    }

    // DTOs for Chat
    public class ChatResponseDto
    {
        public string ResponseText { get; set; } = null!;
        public List<string> FollowupQuestions { get; set; } = new();
        public List<string> PreliminaryRecommendations { get; set; } = new();
        public List<ChatbotEquipmentDto> SuggestedEquipment { get; set; } = new();
        public bool CanConvertToSurvey { get; set; }
    }

    public class ChatbotEquipmentDto
    {
        public string ItemCode { get; set; } = null!;
        public int Quantity { get; set; }
        public string? Name { get; set; }
        public decimal? Price { get; set; }
    }

    // DTOs for Quotation
    public class QuotationSuggestResponseDto
    {
        public List<SuggestedQuotationItemDto> SuggestedItems { get; set; } = new();
        public decimal EquipmentCost { get; set; }
        public decimal InstallationCost { get; set; }
        public decimal SurveyCost { get; set; }
        public decimal MinPriceRange { get; set; }
        public decimal MaxPriceRange { get; set; }
        public List<string> Assumptions { get; set; } = new();
        public List<string> MissingInfo { get; set; } = new();
        public double ConfidenceLevel { get; set; }
    }

    public class SuggestedQuotationItemDto
    {
        public string ItemCode { get; set; } = null!;
        public int Quantity { get; set; }
        public string Rationale { get; set; } = null!;
        public string? ModelId { get; set; }
        public string? Name { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalPrice { get; set; }
    }

    // DTOs for Diagnosis
    public class DiagnosisRequestDto
    {
        public string EquipmentModel { get; set; } = null!;
        public double EquipmentAge { get; set; }
        public string Symptoms { get; set; } = null!;
        public string? RepairHistory { get; set; }
        public string? LastMaintenance { get; set; }
        public string? ErrorCode { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class DiagnosisResponseDto
    {
        public List<string> LikelyCauses { get; set; } = new();
        public double ConfidenceLevel { get; set; }
        public List<string> SafetyCheckSteps { get; set; } = new();
        public List<string> PartsToReplace { get; set; } = new();
        public string UrgencyLevel { get; set; } = null!;
        public bool ShouldStopUsing { get; set; }
        public bool ShouldEscalate { get; set; }
    }

    public class DiagnosisFeedbackRequestDto
    {
        public bool IsCorrect { get; set; }
        public string? TechnicianFeedback { get; set; }
    }

    public class DiagnosisResultWrapperDto
    {
        public string? LogId { get; set; }
        public DiagnosisResponseDto? Diagnosis { get; set; }
    }
}
