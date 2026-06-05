using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum EntitlementSource { Purchase, Activation, Gift }

public class EbookEntitlement : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid BookId { get; private set; }
    public EntitlementSource Source { get; private set; } = EntitlementSource.Purchase;
    public DateTime? ExpiresAt { get; private set; }
    public DateTime? LastReadAt { get; private set; }
    public int ProgressPct { get; private set; }

    public Book? Book { get; private set; }

    private EbookEntitlement() { }

    public static EbookEntitlement Create(
        Guid userId, Guid bookId,
        EntitlementSource source = EntitlementSource.Purchase,
        DateTime? expiresAt = null)
        => new()
        {
            UserId = userId,
            BookId = bookId,
            Source = source,
            ExpiresAt = expiresAt,
            ProgressPct = 0,
        };

    public void UpdateProgress(int pct)
    {
        ProgressPct = Math.Clamp(pct, 0, 100);
        LastReadAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
