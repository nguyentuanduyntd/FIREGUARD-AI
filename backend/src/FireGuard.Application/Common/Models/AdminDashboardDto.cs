using System;
using System.Collections.Generic;

namespace FireGuard.Application.Common.Models
{
    public class AdminDashboardDto
    {
        // Financials
        public decimal TodayRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal AccountsReceivable { get; set; } // Công nợ

        // Quotations
        public int QuotationCount { get; set; }
        public double QuotationSuccessRate { get; set; } // %

        // Projects
        public int OngoingProjects { get; set; }
        public int OverdueProjects { get; set; }

        // Service Repairs
        public int NewRepairs { get; set; }
        public int DispatchingRepairs { get; set; }
        public int CallbackRepairs { get; set; }

        // Resources
        public int OnlineTechnicians { get; set; }
        public double AverageCustomerRating { get; set; }

        // Inventory & Maintenance
        public int LowStockItems { get; set; }
        public int NearingMaintenanceCount { get; set; }
        public int OverdueMaintenanceCount { get; set; }

        // Top Performers
        public List<TopTechnicianKpiDto> TopTechnicians { get; set; } = new();

        // Chart Data
        public List<RevenueChartPoint> RevenueChart { get; set; } = new();
    }

    public class TopTechnicianKpiDto
    {
        public string TechnicianName { get; set; } = null!;
        public double KpiScore { get; set; }
        public int CompletedJobs { get; set; }
    }

    public class RevenueChartPoint
    {
        public string Label { get; set; } = null!;
        public decimal Revenue { get; set; }
    }
}
