using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum OtpType { EmailVerification, PhoneVerification, PasswordReset }

public class OtpVerification : BaseEntity
{
    public string Target { get; private set; } = string.Empty;  // email or phone
    public string CodeHash { get; private set; } = string.Empty;
    public OtpType Type { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? UsedAt { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsUsed => UsedAt.HasValue;
    public bool IsValid => !IsExpired && !IsUsed;

    private OtpVerification() { }

    public static OtpVerification Create(string target, string codeHash, OtpType type, int expiryMinutes = 5)
        => new()
        {
            Id = Guid.NewGuid(),
            Target = target.Trim().ToLowerInvariant(),
            CodeHash = codeHash,
            Type = type,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            CreatedAt = DateTime.UtcNow
        };

    public void MarkUsed() { UsedAt = DateTime.UtcNow; SetUpdatedAt(); }
}
