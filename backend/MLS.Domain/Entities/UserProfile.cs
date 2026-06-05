using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class UserProfile : BaseEntity
{
    public Guid UserId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public DateOnly? DateOfBirth { get; private set; }
    public string? Gender { get; private set; }
    public string? Address { get; private set; }
    public string? CurrentLevel { get; private set; }
    public string? Country { get; private set; }
    public string? NativeLanguage { get; private set; }
    public string? PreferredLocale { get; private set; }

    public User? User { get; private set; }

    private UserProfile() { }

    public static UserProfile Create(Guid userId, string fullName)
        => new()
        {
            Id = userId,      // 1-to-1: UserProfile.Id == User.Id
            UserId = userId,
            FullName = fullName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

    public void Update(string fullName, string? avatarUrl, DateOnly? dob, string? gender, string? address, string? level,
        string? country = null, string? nativeLanguage = null)
    {
        FullName = fullName.Trim();
        AvatarUrl = avatarUrl;
        DateOfBirth = dob;
        Gender = gender;
        Address = address;
        CurrentLevel = level;
        Country = country;
        NativeLanguage = nativeLanguage;
        SetUpdatedAt();
    }

    public void SetAvatarUrl(string path) { AvatarUrl = path; SetUpdatedAt(); }

    public void SetPreferredLocale(string locale)
    {
        if (new[] { "vi", "en", "ko" }.Contains(locale))
        {
            PreferredLocale = locale;
            SetUpdatedAt();
        }
    }
}
