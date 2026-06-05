using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class TeacherProfile : BaseEntity
{
    public Guid UserId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public string? CoverUrl { get; private set; }
    public string? Headline { get; private set; }
    public string? Bio { get; private set; }
    public int ExperienceYears { get; private set; }
    public string? Specialization { get; private set; }
    public string? FacebookUrl { get; private set; }
    public string? YoutubeUrl { get; private set; }
    public string? TiktokUrl { get; private set; }
    public string? WebsiteUrl { get; private set; }
    public bool IsVerified { get; private set; }
    public bool IsPublic { get; private set; } = true;
    public int FollowerCount { get; private set; }
    public int CourseCount { get; private set; }
    public decimal RatingAverage { get; private set; }
    public long TotalViews { get; private set; }
    public long TotalStudents { get; private set; }

    private TeacherProfile() { }

    public static TeacherProfile Create(
        Guid userId, string displayName, string slug,
        string? avatarUrl = null, string? coverUrl = null,
        string? headline = null, string? bio = null,
        int experienceYears = 0, string? specialization = null)
    {
        return new TeacherProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DisplayName = displayName,
            Slug = slug,
            AvatarUrl = avatarUrl,
            CoverUrl = coverUrl,
            Headline = headline,
            Bio = bio,
            ExperienceYears = experienceYears,
            Specialization = specialization,
            IsPublic = true,
        };
    }

    public void Update(
        string displayName, string slug,
        string? avatarUrl, string? coverUrl,
        string? headline, string? bio,
        int experienceYears, string? specialization,
        string? facebookUrl, string? youtubeUrl,
        string? tiktokUrl, string? websiteUrl)
    {
        DisplayName = displayName;
        Slug = slug;
        AvatarUrl = avatarUrl;
        CoverUrl = coverUrl;
        Headline = headline;
        Bio = bio;
        ExperienceYears = experienceYears;
        Specialization = specialization;
        FacebookUrl = facebookUrl;
        YoutubeUrl = youtubeUrl;
        TiktokUrl = tiktokUrl;
        WebsiteUrl = websiteUrl;
    }

    public void SetVerified(bool verified) => IsVerified = verified;
    public void SetPublic(bool isPublic) => IsPublic = isPublic;
    public void IncrementFollower() => FollowerCount++;
    public void DecrementFollower() { if (FollowerCount > 0) FollowerCount--; }
}
