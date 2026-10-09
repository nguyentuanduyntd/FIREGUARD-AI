using FireGuard.Domain.Common;
using FireGuard.Domain.Entities.CRM;

namespace FireGuard.Domain.Entities.Sales
{
    public enum ContractStatus
    {
        Active,
        Suspended,
        Expired,
        Completed
    }

    public class Contract : AuditableEntity<string>
    {
        public Contract()
        {
            Id = Guid.NewGuid().ToString();
            Installments = new HashSet<ContractInstallment>();
        }

        public string ContractNumber { get; set; } = null!;
        public string CustomerId { get; set; } = null!;
        public virtual Customer Customer { get; set; } = null!;

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public decimal TotalValue { get; set; }
        public ContractStatus Status { get; set; } = ContractStatus.Active;
        
        public string? AttachmentUrl { get; set; }
        public string? Notes { get; set; }

        public virtual ICollection<ContractInstallment> Installments { get; set; }
    }
}
