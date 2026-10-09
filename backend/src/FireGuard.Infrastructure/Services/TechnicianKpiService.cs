using System;
using System.Linq;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class TechnicianKpiService : ITechnicianKpiService
    {
        private readonly ApplicationDbContext _context;

        public TechnicianKpiService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task CalculateMonthlyKpiAsync(int year, int month)
        {
            var technicians = await _context.Users
                .Where(u => u.IsActive && u.IsTechnician)
                .ToListAsync();

            foreach (var tech in technicians)
            {
                // Verify if KPI already generated to prevent duplication
                var exists = await _context.TechnicianKpis
                    .FirstOrDefaultAsync(k => k.TechnicianId == tech.Id && k.Year == year && k.Month == month);

                // Fetch actual completed jobs from database for this month
                var completedJobsCount = await _context.ServiceRequests
                    .CountAsync(r => r.AssignedTechnicianId == tech.Id && 
                                     r.Status == ServiceRequestStatus.Completed &&
                                     r.LastModifiedAtUtc.HasValue &&
                                     r.LastModifiedAtUtc.Value.Year == year &&
                                     r.LastModifiedAtUtc.Value.Month == month);

                // Fetch actual late arrival counts (if any logs exist)
                var lateCount = await _context.ServiceRequestStatusLogs
                    .CountAsync(l => l.ChangedBy == tech.Username && 
                                     l.ToStatus == ServiceRequestStatus.CheckedIn && 
                                     l.Notes != null && l.Notes.ToLower().Contains("trễ"));

                // Calculate sub-metrics
                double acceptanceRate = tech.AcceptanceRate * 100; // %
                double customerRating = tech.AverageRating; // 1-5
                double firstTimeFixRate = (1.0 - tech.CallbackRate) * 100; // %
                int callbackCount = (int)Math.Round(completedJobsCount * tech.CallbackRate);
                double complianceRate = 98.5; // default high check-in check-out compliance
                double reportQualityScore = 90.0; // default report quality
                int complaintCount = 0; // default zero complaints

                // Calculate On-Time Rate
                double onTimeRate = 100.0;
                if (completedJobsCount > 0)
                {
                    onTimeRate = Math.Max(0, 100 * (1.0 - ((double)lateCount / completedJobsCount)));
                }

                // Weighted Score Calculation
                // 1. Completed Jobs (25%): Capped at 100 if completed >= 12 jobs
                double scoreJobs = Math.Min(100.0, (completedJobsCount / 12.0) * 100.0);
                // 2. Customer Rating (20%): Map 1-5 to 0-100
                double scoreRating = (customerRating / 5.0) * 100.0;
                // 3. Acceptance Rate (15%): Direct percentage
                double scoreAcceptance = acceptanceRate;
                // 4. First Time Fix Rate (15%): Direct percentage
                double scoreFix = firstTimeFixRate;
                // 5. On-Time Rate (15%): Direct percentage
                double scoreOnTime = onTimeRate;
                // 6. Compliance Rate (10%): Direct percentage
                double scoreCompliance = complianceRate;

                // Total Raw Score
                double rawScore = (scoreJobs * 0.25) + (scoreRating * 0.20) + (scoreAcceptance * 0.15) +
                                  (scoreFix * 0.15) + (scoreOnTime * 0.15) + (scoreCompliance * 0.10);

                // Deductions
                rawScore = Math.Max(0, rawScore - (complaintCount * 10));
                rawScore = Math.Round(rawScore, 1);

                // AI summary generation logic (Rule-based diagnostic summary)
                string aiSummary = "";
                decimal proposedBonus = 0;

                if (rawScore >= 90)
                {
                    proposedBonus = 2000000; // 2,000,000 VND
                    aiSummary = $"Kỹ thuật viên {tech.FullName} đạt hiệu suất xuất sắc ({rawScore}/100). Hoàn thành tốt {completedJobsCount} đơn hàng với điểm đánh giá trung bình {customerRating}/5. Tỷ lệ sửa chữa thành công lần đầu đạt {Math.Round(firstTimeFixRate, 1)}%. Đề xuất thưởng nóng xuất sắc và tiếp tục nhân rộng mô hình làm việc.";
                }
                else if (rawScore >= 80)
                {
                    proposedBonus = 1000000; // 1,000,000 VND
                    aiSummary = $"Kỹ thuật viên {tech.FullName} đạt hiệu suất tốt ({rawScore}/100). Hoàn thành tốt {completedJobsCount} đơn hàng. Các chỉ số kỹ năng, đi đúng giờ và tuân thủ quy trình đạt chuẩn. Đề xuất thưởng mức tiêu chuẩn.";
                }
                else if (rawScore >= 60)
                {
                    proposedBonus = 0;
                    aiSummary = $"Kỹ thuật viên {tech.FullName} đạt hiệu suất trung bình ({rawScore}/100). Cần cải thiện thêm tỷ lệ hoàn thành công việc và đi đúng giờ để nâng cao năng suất tháng sau.";
                }
                else
                {
                    proposedBonus = 0;
                    aiSummary = $"Cảnh báo hiệu suất: Kỹ thuật viên {tech.FullName} có điểm KPI thấp ({rawScore}/100). Đề xuất trưởng bộ phận tổ chức kiểm điểm thái độ làm việc và bổ túc kỹ năng nghiệp vụ.";
                }

                if (exists == null)
                {
                    var newKpi = new TechnicianKpi
                    {
                        TechnicianId = tech.Id,
                        Year = year,
                        Month = month,
                        CompletedJobs = completedJobsCount,
                        LateCount = lateCount,
                        AcceptanceRate = acceptanceRate,
                        CustomerRating = customerRating,
                        FirstTimeFixRate = firstTimeFixRate,
                        CallbackCount = callbackCount,
                        ComplianceRate = complianceRate,
                        ReportQualityScore = reportQualityScore,
                        ComplaintCount = complaintCount,
                        OnTimeRate = onTimeRate,
                        RawKpiScore = rawScore,
                        AdjustedScore = rawScore,
                        AdjustmentValue = 0,
                        AiSummary = aiSummary,
                        ProposedBonus = proposedBonus,
                        ApprovedBonus = 0,
                        IsApproved = false
                    };
                    await _context.TechnicianKpis.AddAsync(newKpi);
                }
                else
                {
                    // Update raw scores if not yet approved
                    if (!exists.IsApproved)
                    {
                        exists.CompletedJobs = completedJobsCount;
                        exists.LateCount = lateCount;
                        exists.AcceptanceRate = acceptanceRate;
                        exists.CustomerRating = customerRating;
                        exists.FirstTimeFixRate = firstTimeFixRate;
                        exists.CallbackCount = callbackCount;
                        exists.OnTimeRate = onTimeRate;
                        exists.RawKpiScore = rawScore;
                        exists.AdjustedScore = rawScore + exists.AdjustmentValue;
                        exists.AiSummary = aiSummary;
                        exists.ProposedBonus = proposedBonus;
                        _context.TechnicianKpis.Update(exists);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> AdjustKpiAsync(string kpiId, double adjustmentValue, string reason, string adminUsername)
        {
            var kpi = await _context.TechnicianKpis.FirstOrDefaultAsync(k => k.Id == kpiId);
            if (kpi == null) return false;

            kpi.AdjustmentValue = adjustmentValue;
            kpi.AdjustedScore = Math.Clamp(kpi.RawKpiScore + adjustmentValue, 0, 100);
            kpi.AdjustmentReason = reason;
            kpi.AdjustedBy = adminUsername;
            kpi.AdjustedAtUtc = DateTime.UtcNow;

            _context.TechnicianKpis.Update(kpi);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ApproveKpiAsync(string kpiId, decimal approvedBonus, string? adminNotes)
        {
            var kpi = await _context.TechnicianKpis.FirstOrDefaultAsync(k => k.Id == kpiId);
            if (kpi == null) return false;

            kpi.ApprovedBonus = approvedBonus;
            kpi.AdminNotes = adminNotes;
            kpi.IsApproved = true;

            _context.TechnicianKpis.Update(kpi);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
