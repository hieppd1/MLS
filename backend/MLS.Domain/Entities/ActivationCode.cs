using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ActivationCodeStatus { New, Activated, Expired, Blocked }

public class ActivationCode : BaseEntity
{
    public string Code            { get; private set; } = string.Empty;
    public Guid   BookId          { get; private set; }
    public Guid   OrderId         { get; private set; }
    public Guid   OrderItemId     { get; private set; }
    public Guid?  UserId          { get; private set; }
    public ActivationCodeStatus Status { get; private set; } = ActivationCodeStatus.New;
    public DateTime? ActivatedAt  { get; private set; }
    public DateTime? ExpiresAt    { get; private set; }

    public Book? Book { get; private set; }

    private ActivationCode() { }

    public static ActivationCode Generate(
        Guid bookId,
        Guid orderId,
        Guid orderItemId,
        DateTime? expiresAt = null)
        => new()
        {
            Code        = GenerateCode(),
            BookId      = bookId,
            OrderId     = orderId,
            OrderItemId = orderItemId,
            Status      = ActivationCodeStatus.New,
            ExpiresAt   = expiresAt
        };

    public void Activate(Guid userId)
    {
        if (Status == ActivationCodeStatus.Activated)
            throw new InvalidOperationException("Mã kích hoạt đã được sử dụng.");
        if (Status == ActivationCodeStatus.Blocked)
            throw new InvalidOperationException("Mã kích hoạt đã bị khoá.");
        if (Status == ActivationCodeStatus.Expired || (ExpiresAt.HasValue && ExpiresAt < DateTime.UtcNow))
        {
            Status = ActivationCodeStatus.Expired;
            throw new InvalidOperationException("Mã kích hoạt đã hết hạn.");
        }

        UserId      = userId;
        Status      = ActivationCodeStatus.Activated;
        ActivatedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void Block()
    {
        Status = ActivationCodeStatus.Blocked;
        SetUpdatedAt();
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        string Seg() => new(Enumerable.Range(0, 4)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
        return $"{Seg()}-{Seg()}-{Seg()}-{Seg()}";
    }
}
