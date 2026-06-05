using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum UserStatus { PendingVerification, Active, Inactive, Suspended }

public class User : BaseEntity
{
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? PasswordHash { get; private set; }
    public string? GoogleId { get; private set; }
    public UserStatus Status { get; private set; }
    public long? MoodleUserId { get; private set; }
    public DateTime? LastActiveAt { get; private set; }

    public UserProfile? Profile { get; private set; }
    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();

    private User() { }

    public static User CreateWithEmail(string email, string passwordHash)
        => new()
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            Status = UserStatus.PendingVerification,
            CreatedAt = DateTime.UtcNow
        };

    public static User CreateWithGoogle(string email, string googleId)
        => new()
        {
            Id = Guid.NewGuid(),
            Email = email.ToLowerInvariant().Trim(),
            GoogleId = googleId,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

    public void Activate() { Status = UserStatus.Active; SetUpdatedAt(); }
    public void Suspend() { Status = UserStatus.Suspended; SetUpdatedAt(); }
    public void Deactivate() { Status = UserStatus.Inactive; SetUpdatedAt(); }
    public void SetPhone(string phone) { Phone = phone.Trim(); SetUpdatedAt(); }
    public void SetPasswordHash(string hash) { PasswordHash = hash; SetUpdatedAt(); }
    public void SetMoodleId(long id) { MoodleUserId = id; SetUpdatedAt(); }
    public void LinkGoogle(string googleId) { GoogleId = googleId; SetUpdatedAt(); }
    public void Touch() { LastActiveAt = DateTime.UtcNow; SetUpdatedAt(); }
}
