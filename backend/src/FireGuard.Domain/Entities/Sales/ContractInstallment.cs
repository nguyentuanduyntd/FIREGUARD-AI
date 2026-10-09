using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Sales
{
    public class ContractInstallment : BaseEntity<string>
    {
        public ContractInstallment()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string ContractId { get; set; } = null!;
        public virtual Contract Contract { get; set; } = null!;

        public string StageName { get; set; } = null!; // e.g. Đợt 1 (Tạm ứng), Đợt 2 (Nghiệm thu)
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; } = false;
    }
}
