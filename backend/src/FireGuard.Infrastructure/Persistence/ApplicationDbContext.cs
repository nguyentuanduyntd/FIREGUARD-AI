using System.Reflection;
using FireGuard.Application.Common.Interfaces;
using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.Catalog;
using FireGuard.Domain.Entities.CRM;
using FireGuard.Domain.Entities.IAM;
using FireGuard.Domain.Entities.Inventory;
using FireGuard.Domain.Entities.Projects;
using FireGuard.Domain.Entities.Sales;
using FireGuard.Domain.Entities.Services;
using FireGuard.Domain.Entities.Notifications;
using Microsoft.EntityFrameworkCore;

namespace FireGuard.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ICurrentUserService? _currentUserService;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ICurrentUserService? currentUserService = null)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<UserDevice> UserDevices => Set<UserDevice>();
        public DbSet<Domain.Entities.Services.AuditLog> AuditLogs => Set<Domain.Entities.Services.AuditLog>();

        public DbSet<EquipmentCategory> EquipmentCategories => Set<EquipmentCategory>();
        public DbSet<EquipmentModel> EquipmentModels => Set<EquipmentModel>();
        public DbSet<EquipmentAsset> EquipmentAssets => Set<EquipmentAsset>();
        public DbSet<EquipmentQRCode> EquipmentQRCodes => Set<EquipmentQRCode>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<Brand> Brands => Set<Brand>();
        public DbSet<Unit> Units => Set<Unit>();

        // CRM Entities
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
        public DbSet<CustomerContact> CustomerContacts => Set<CustomerContact>();
        public DbSet<CustomerNote> CustomerNotes => Set<CustomerNote>();
        public DbSet<SurveyRequest> SurveyRequests => Set<SurveyRequest>();
        public DbSet<SurveyImage> SurveyImages => Set<SurveyImage>();
        public DbSet<SurveyProposedItem> SurveyProposedItems => Set<SurveyProposedItem>();

        // Inventory Entities
        public DbSet<Warehouse> Warehouses => Set<Warehouse>();
        public DbSet<WarehouseStock> WarehouseStocks => Set<WarehouseStock>();
        public DbSet<StockReceipt> StockReceipts => Set<StockReceipt>();
        public DbSet<StockReceiptItem> StockReceiptItems => Set<StockReceiptItem>();
        public DbSet<StockIssue> StockIssues => Set<StockIssue>();
        public DbSet<StockIssueItem> StockIssueItems => Set<StockIssueItem>();
        public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

        // Sales / Quotation Entities
        public DbSet<Quotation> Quotations => Set<Quotation>();
        public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();
        public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
        public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
        public DbSet<Contract> Contracts => Set<Contract>();
        public DbSet<ContractInstallment> ContractInstallments => Set<ContractInstallment>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
        public DbSet<Payment> Payments => Set<Payment>();

        // Project Entities
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
        public DbSet<ProjectProgressLog> ProjectProgressLogs => Set<ProjectProgressLog>();
        public DbSet<ProjectEquipment> ProjectEquipments => Set<ProjectEquipment>();

        // Service Entities
        public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
        public DbSet<ServiceRequestStatusLog> ServiceRequestStatusLogs => Set<ServiceRequestStatusLog>();
        public DbSet<AIDiagnosisLog> AIDiagnosisLogs => Set<AIDiagnosisLog>();
        public DbSet<ServiceRequestDispatch> ServiceRequestDispatches => Set<ServiceRequestDispatch>();
        public DbSet<TechnicianDispatchScore> TechnicianDispatchScores => Set<TechnicianDispatchScore>();
        public DbSet<MaintenanceReminder> MaintenanceReminders => Set<MaintenanceReminder>();
        public DbSet<TechnicianKpi> TechnicianKpis => Set<TechnicianKpi>();
        public DbSet<TechnicianGpsLog> TechnicianGpsLogs => Set<TechnicianGpsLog>();
        public DbSet<ReportExport> ReportExports => Set<ReportExport>();

        // Notification Entities
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<EmailLog> EmailLogs => Set<EmailLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Ignore<FireGuard.Domain.Entities.IAM.AuditLog>();

            // Apply configurations from assembly
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            modelBuilder.Entity<ServiceRequest>()
                .HasOne(sr => sr.DispatchRecommendation)
                .WithOne(srd => srd.ServiceRequest)
                .HasForeignKey<ServiceRequestDispatch>(srd => srd.ServiceRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Global Soft Delete Filter
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
                {
                    var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                    var body = System.Linq.Expressions.Expression.Equal(
                        System.Linq.Expressions.Expression.Property(parameter, nameof(ISoftDelete.IsDeleted)),
                        System.Linq.Expressions.Expression.Constant(false));
                    
                    var lambda = System.Linq.Expressions.Expression.Lambda(body, parameter);
                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var currentUser = _currentUserService?.Username ?? "System";

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity is BaseEntity<string> baseEntity)
                    {
                        if (baseEntity.CreatedAtUtc == default)
                            baseEntity.CreatedAtUtc = DateTime.UtcNow;
                        baseEntity.CreatedBy = currentUser;
                    }
                    else if (entry.Entity is BaseEntity<long> baseLongEntity)
                    {
                        if (baseLongEntity.CreatedAtUtc == default)
                            baseLongEntity.CreatedAtUtc = DateTime.UtcNow;
                        baseLongEntity.CreatedBy = currentUser;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    if (entry.Entity is IAuditableEntity auditableEntity)
                    {
                        auditableEntity.LastModifiedAtUtc = DateTime.UtcNow;
                        auditableEntity.LastModifiedBy = currentUser;
                    }
                }
                else if (entry.State == EntityState.Deleted)
                {
                    if (entry.Entity is ISoftDelete softDeleteEntity)
                    {
                        entry.State = EntityState.Modified;
                        softDeleteEntity.IsDeleted = true;
                        softDeleteEntity.DeletedAtUtc = DateTime.UtcNow;
                        softDeleteEntity.DeletedBy = currentUser;
                    }
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
