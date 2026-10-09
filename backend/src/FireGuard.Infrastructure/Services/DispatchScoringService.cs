using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Services;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Services
{
    public class DispatchScoringService : IDispatchScoringService
    {
        private readonly ApplicationDbContext _context;

        public DispatchScoringService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceRequestDispatch> GenerateRecommendationAsync(
            string serviceRequestId,
            double maxDistanceKm = 30.0,
            double distanceWeight = 0.25,
            double skillWeight = 0.25,
            double availabilityWeight = 0.15,
            double ratingWeight = 0.10,
            double workloadWeight = 0.10,
            double firstTimeFixWeight = 0.10,
            double acceptanceWeight = 0.05)
        {
            var request = await _context.ServiceRequests
                .Include(r => r.Address)
                .FirstOrDefaultAsync(r => r.Id == serviceRequestId);

            if (request == null)
            {
                throw new ArgumentException("Service request not found.", nameof(serviceRequestId));
            }

            // Create Dispatch recommendation entity
            var dispatch = new ServiceRequestDispatch
            {
                ServiceRequestId = serviceRequestId,
                DistanceWeight = distanceWeight,
                SkillWeight = skillWeight,
                AvailabilityWeight = availabilityWeight,
                RatingWeight = ratingWeight,
                WorkloadWeight = workloadWeight,
                FirstTimeFixWeight = firstTimeFixWeight,
                AcceptanceWeight = acceptanceWeight
            };

            // Get all active technicians
            var technicians = await _context.Users
                .Where(u => u.IsActive && u.IsTechnician)
                .ToListAsync();

            // Determine required skills from request description
            var requiredSkills = DetermineRequiredSkills(request);
            
            // Determine request brand if any
            var requestBrand = DetermineBrandName(request);

            var activeJobCounts = await _context.ServiceRequests
                .Where(r => r.AssignedTechnicianId != null &&
                            r.Status != ServiceRequestStatus.Completed &&
                            r.Status != ServiceRequestStatus.Cancelled)
                .GroupBy(r => r.AssignedTechnicianId)
                .Select(g => new { TechnicianId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TechnicianId!, x => x.Count);

            foreach (var tech in technicians)
            {
                // Rule 1: Exclude technicians not on shift (not on duty)
                if (!tech.IsOnDuty) continue;

                // Rule 2: Exclude technicians on leave
                if (tech.IsOnLeave) continue;

                // Rule 3: Exclude technicians without mandatory skills
                var techSkills = tech.Skills?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) 
                                 ?? Array.Empty<string>();

                bool hasSkills = requiredSkills.All(req => 
                    techSkills.Any(ts => ts.Equals(req, StringComparison.OrdinalIgnoreCase)));
                
                if (!hasSkills) continue;

                // Rule 4: Distance calculation & exclusion threshold
                double distance = 0;
                if (request.Address.Latitude.HasValue && request.Address.Longitude.HasValue && 
                    tech.Latitude.HasValue && tech.Longitude.HasValue)
                {
                    distance = CalculateHaversineDistance(
                        request.Address.Latitude.Value, request.Address.Longitude.Value,
                        tech.Latitude.Value, tech.Longitude.Value);
                    
                    if (distance > maxDistanceKm) continue; // Exclude if too far
                }
                else
                {
                    // If either has no coordinates, default to 15km
                    distance = 15.0;
                }

                // Compute scores
                // 1. Distance Score: maximum score of 100 when distance is 0. Decreases linearly.
                double distanceScore = Math.Max(0, 100 * (1 - (distance / maxDistanceKm)));

                // 2. Skill Score: 100 base if matches mandatory. Add 20 points bonus if they have brand experience.
                double skillScore = 80; // base for mandatory skills
                if (!string.IsNullOrEmpty(requestBrand) && tech.ExperiencedBrands != null)
                {
                    var brands = tech.ExperiencedBrands.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    if (brands.Any(b => b.Equals(requestBrand, StringComparison.OrdinalIgnoreCase)))
                    {
                        skillScore = 100; // maximum skill compatibility due to brand knowledge
                    }
                }

                // 3. Availability Score: based on active jobs in queue
                int activeCount = activeJobCounts.ContainsKey(tech.Id) ? activeJobCounts[tech.Id] : 0;
                double availabilityScore = Math.Max(0, 100 - (activeCount * 30));

                // 4. Rating Score: 1-5 scale mapped to 0-100
                double ratingScore = (tech.AverageRating / 5.0) * 100;

                // 5. Workload Score: combination of active queue and total completed today
                double workloadScore = Math.Max(0, 100 - (activeCount * 15) - (tech.DailyJobsCompleted * 8));

                // 6. First-time Fix Score: based on callback rates (callbacks mean low score)
                double firstTimeFixScore = (1.0 - tech.CallbackRate) * 100;

                // 7. Acceptance Score: based on acceptance rate
                double acceptanceScore = tech.AcceptanceRate * 100;

                // Sum weighted scores
                double totalScore = 
                    (distanceScore * distanceWeight) +
                    (skillScore * skillWeight) +
                    (availabilityScore * availabilityWeight) +
                    (ratingScore * ratingWeight) +
                    (workloadScore * workloadWeight) +
                    (firstTimeFixScore * firstTimeFixWeight) +
                    (acceptanceScore * acceptanceWeight);

                var breakdownStats = new Dictionary<string, object>
                {
                    { "DistanceKm", Math.Round(distance, 2) },
                    { "ActiveJobs", activeCount },
                    { "DailyJobsCompleted", tech.DailyJobsCompleted },
                    { "Rating", tech.AverageRating },
                    { "CallbackRate", tech.CallbackRate },
                    { "AcceptanceRate", tech.AcceptanceRate }
                };

                // Formulate explanation justification text
                string explanation = $"{tech.FullName} đạt tổng {Math.Round(totalScore, 1)}/100 điểm. " +
                                     $"Khoảng cách: {Math.Round(distance, 1)}km ({Math.Round(distanceScore, 0)}đ). " +
                                     $"Đang xử lý {activeCount} đơn ({Math.Round(availabilityScore, 0)}đ). " +
                                     $"Kỹ năng: {string.Join(", ", requiredSkills)} ({Math.Round(skillScore, 0)}đ).";

                dispatch.TechnicianScores.Add(new TechnicianDispatchScore
                {
                    TechnicianId = tech.Id,
                    TechnicianName = tech.FullName,
                    DistanceScore = distanceScore,
                    SkillScore = skillScore,
                    AvailabilityScore = availabilityScore,
                    RatingScore = ratingScore,
                    WorkloadScore = workloadScore,
                    FirstTimeFixScore = firstTimeFixScore,
                    AcceptanceScore = acceptanceScore,
                    TotalScore = totalScore,
                    ScoreBreakdownJson = JsonSerializer.Serialize(breakdownStats),
                    RankingExplanation = explanation
                });
            }

            // Order candidates by total score descending
            dispatch.TechnicianScores = dispatch.TechnicianScores
                .OrderByDescending(ts => ts.TotalScore)
                .ToList();

            // Set the first recommendation as the default chosen technician
            if (dispatch.TechnicianScores.Any())
            {
                dispatch.ChosenTechnicianId = dispatch.TechnicianScores.First().TechnicianId;
                dispatch.DispatchNotes = $"AI tự động đề xuất {dispatch.TechnicianScores.First().TechnicianName} là kỹ thuật viên phù hợp nhất.";
            }

            return dispatch;
        }

        private List<string> DetermineRequiredSkills(ServiceRequest request)
        {
            var reqs = new List<string>();
            var desc = request.Description.ToLower();
            
            if (desc.Contains("bơm") || desc.Contains("pump"))
                reqs.Add("Pumps");
            if (desc.Contains("khói") || desc.Contains("smoke") || desc.Contains("tủ trung tâm") || desc.Contains("alarm") || desc.Contains("báo cháy"))
                reqs.Add("Alarms");
            if (desc.Contains("sprinkler") || desc.Contains("đầu phun") || desc.Contains("vòi") || desc.Contains("họng"))
                reqs.Add("Sprinklers");
            if (desc.Contains("bình") || desc.Contains("extinguisher"))
                reqs.Add("Extinguishers");
            
            if (reqs.Count == 0)
                reqs.Add("General");
            
            return reqs;
        }

        private string? DetermineBrandName(ServiceRequest request)
        {
            var desc = request.Description.ToLower();
            if (desc.Contains("firesmart")) return "FireSmart";
            if (desc.Contains("tyco")) return "Tyco";
            if (desc.Contains("horings")) return "Horings";
            if (desc.Contains("yamato")) return "Yamato";
            if (desc.Contains("pentax")) return "Pentax";
            return null;
        }

        private double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371d; 
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double val)
        {
            return (Math.PI / 180) * val;
        }
    }
}
