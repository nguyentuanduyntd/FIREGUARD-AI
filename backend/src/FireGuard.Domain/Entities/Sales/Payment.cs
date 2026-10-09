using FireGuard.Domain.Common;

namespace FireGuard.Domain.Entities.Sales
{
    public enum PaymentMethod
    {
        Cash,
        BankTransfer
    }

    public class Payment : AuditableEntity<string>
    {
        public Payment()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string PaymentNumber { get; set; } = null!;
        public string? InvoiceId { get; set; }
        public virtual Invoice? Invoice { get; set; }

        public string? ContractId { get; set; }
        public virtual Contract? Contract { get; set; }

        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
        public string? ReferenceNumber { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public string? AttachmentUrl { get; set; } // Uploaded transaction receipt / photo
    }
}
