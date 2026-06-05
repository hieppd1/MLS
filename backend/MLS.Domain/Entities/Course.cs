using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum CourseStatus { Draft, PendingReview, Published, Hidden, Archived }
public enum CourseVisibility { Public, Private }

public class Course : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string? Code { get; private set; }
    public string? Slug { get; private set; }
    public string? ShortDescription { get; private set; }
    public string? Description { get; private set; }
    public int Level { get; private set; } // 1–6
    public string? Language { get; private set; } = "VI";
    public string? ThumbnailUrl { get; private set; }
    public string? BannerUrl { get; private set; }
    public string? Tags { get; private set; } // JSON array string e.g. ["IELTS","English"]
    public string? Outcomes { get; private set; }     // JSON array: what you will learn
    public string? Requirements { get; private set; } // JSON array: prerequisites
    public string? TargetAudience { get; private set; } // JSON array: who this course is for
    public int? Duration { get; private set; } // total minutes
    public CourseStatus Status { get; private set; } = CourseStatus.Draft;
    public CourseVisibility Visibility { get; private set; } = CourseVisibility.Public;
    public bool IsFree { get; private set; }
    public bool CertificateEnabled { get; private set; }
    public bool CompletionRequired { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public Guid? TeacherId { get; private set; }
    public Guid CreatedBy { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public decimal Price { get; private set; }
    public decimal? DiscountPrice { get; private set; }
    public DateTime? DiscountEndsAt { get; private set; }

    public ICollection<CourseLevel> Levels { get; private set; } = [];
    public ICollection<CourseModule> Modules { get; private set; } = [];
    public ICollection<CourseEnrollment> Enrollments { get; private set; } = [];

    private Course() { }

    public static Course Create(string title, string? description, int level, Guid createdBy, Guid? teacherId = null,
        decimal price = 0, decimal? discountPrice = null, DateTime? discountEndsAt = null,
        string? shortDescription = null, bool isFree = false, bool certificateEnabled = false,
        CourseVisibility visibility = CourseVisibility.Public,
        string? code = null, string? language = "VI", string? bannerUrl = null, string? tags = null,
        int? duration = null, DateTime? startDate = null, DateTime? endDate = null, bool completionRequired = false,
        string? outcomes = null, string? requirements = null, string? targetAudience = null)
        => new()
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Slug = GenerateSlug(title),
            Code = code?.Trim(),
            ShortDescription = shortDescription?.Trim(),
            Description = description?.Trim(),
            Level = level,
            Language = language ?? "VI",
            BannerUrl = bannerUrl?.Trim(),
            Tags = tags,
            Outcomes = outcomes,
            Requirements = requirements,
            TargetAudience = targetAudience,
            Duration = duration,
            StartDate = startDate,
            EndDate = endDate,
            CreatedBy = createdBy,
            TeacherId = teacherId,
            Status = CourseStatus.Draft,
            Visibility = visibility,
            IsFree = isFree || price == 0,
            CertificateEnabled = certificateEnabled,
            CompletionRequired = completionRequired,
            CreatedAt = DateTime.UtcNow,
            Price = price,
            DiscountPrice = discountPrice,
            DiscountEndsAt = discountEndsAt,
        };

    public void Update(string title, string? description, int level, Guid? teacherId,
        decimal price = 0, decimal? discountPrice = null, DateTime? discountEndsAt = null,
        string? shortDescription = null, bool isFree = false, bool certificateEnabled = false,
        CourseVisibility visibility = CourseVisibility.Public,
        string? thumbnailUrl = null, string? bannerUrl = null, string? language = null,
        string? tags = null, int? duration = null, DateTime? startDate = null, DateTime? endDate = null,
        bool completionRequired = false, string? code = null,
        string? outcomes = null, string? requirements = null, string? targetAudience = null)
    {
        Title = title.Trim();
        if (code != null) Code = code.Trim();
        ShortDescription = shortDescription?.Trim();
        Description = description?.Trim();
        Level = level;
        TeacherId = teacherId;
        Price = price;
        DiscountPrice = discountPrice;
        DiscountEndsAt = discountEndsAt;
        IsFree = isFree || price == 0;
        CertificateEnabled = certificateEnabled;
        CompletionRequired = completionRequired;
        Visibility = visibility;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl.Trim();
        if (bannerUrl != null) BannerUrl = bannerUrl.Trim();
        if (language != null) Language = language;
        if (tags != null) Tags = tags;
        Outcomes = outcomes;
        Requirements = requirements;
        TargetAudience = targetAudience;
        if (duration.HasValue) Duration = duration;
        if (startDate.HasValue) StartDate = startDate;
        if (endDate.HasValue) EndDate = endDate;
        SetUpdatedAt();
    }

    public void SetThumbnail(string url) { ThumbnailUrl = url; SetUpdatedAt(); }
    public void SetSlug(string slug) { Slug = slug.Trim().ToLower(); SetUpdatedAt(); }

    public void SubmitForReview()
    {
        if (Status != CourseStatus.Draft) throw new InvalidOperationException("Only Draft courses can be submitted.");
        Status = CourseStatus.PendingReview;
        SetUpdatedAt();
    }

    public void Publish()
    {
        Status = CourseStatus.Published;
        PublishedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void Reject() { Status = CourseStatus.Draft; SetUpdatedAt(); }

    public void Hide()
    {
        if (Status != CourseStatus.Published) throw new InvalidOperationException("Only Published courses can be hidden.");
        Status = CourseStatus.Hidden;
        SetUpdatedAt();
    }

    public void Archive() { Status = CourseStatus.Archived; SetUpdatedAt(); }

    /// <summary>Creates a Draft copy of this course (modules + lessons, no video assets).</summary>
    public Course CloneAs(Guid createdBy)
    {
        var cloneShortId = Guid.NewGuid().ToString("N")[..8];
        var clone = new Course
        {
            Id = Guid.NewGuid(),
            Title = $"[Bản sao] {Title}",
            Slug = $"copy-{cloneShortId}-{Slug}",
            Code = null,
            ShortDescription = ShortDescription,
            Description = Description,
            Level = Level,
            Language = Language,
            ThumbnailUrl = ThumbnailUrl,
            BannerUrl = BannerUrl,
            Tags = Tags,
            Outcomes = Outcomes,
            Requirements = Requirements,
            TargetAudience = TargetAudience,
            Duration = Duration,
            Status = CourseStatus.Draft,
            Visibility = CourseVisibility.Private,
            IsFree = IsFree,
            CertificateEnabled = CertificateEnabled,
            CompletionRequired = CompletionRequired,
            TeacherId = TeacherId,
            CreatedBy = createdBy,
            Price = Price,
            DiscountPrice = DiscountPrice,
            DiscountEndsAt = DiscountEndsAt,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var module in Modules.OrderBy(m => m.OrderIndex))
        {
            var cloneModule = CourseModule.Create(clone.Id, module.Title, module.Description, module.OrderIndex);
            foreach (var session in module.Sessions.OrderBy(s => s.OrderIndex))
            {
                var cloneSession = Session.Create(
                    cloneModule.Id, session.Title, session.Description,
                    session.OrderIndex, session.IsFreeTrial, session.SessionType);
                cloneModule.Sessions.Add(cloneSession);
            }
            clone.Modules.Add(cloneModule);
        }

        return clone;
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.Trim().ToLower()
            .Replace(" ", "-")
            .Replace("đ", "d");
        // Remove characters that are not alphanumeric or hyphens
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        var shortId = Guid.NewGuid().ToString("N")[..6];
        return slug.Length > 0 ? $"{slug}-{shortId}" : Guid.NewGuid().ToString("N")[..12];
    }
}
