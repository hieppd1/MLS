using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum SessionPublishStatus { Draft, Published }

/// <summary>
/// Unified content type — replaces separate Lesson entity.
/// Interactive = video + timeline-based segments (default).
/// Other types use a single auto-segment with content fields.
/// </summary>
public enum SessionType { Interactive, Video, Reading, Audio, Pdf, Quiz }

public class Session : BaseEntity
{
    public Guid ModuleId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int OrderIndex { get; private set; }
    public bool IsFreeTrial { get; private set; }
    public SessionPublishStatus PublishStatus { get; private set; } = SessionPublishStatus.Draft;
    public SessionType SessionType { get; private set; } = SessionType.Interactive;

    // Video (nullable — can be added after creation)
    public Guid? VideoAssetId { get; private set; }
    public int DurationSeconds { get; private set; }
    public string? ThumbnailUrl { get; private set; }

    // Non-video content (for Reading / Audio / Pdf / Quiz types)
    public string? Content { get; private set; }        // HTML for Reading
    public string? AudioUrl { get; private set; }       // for Audio
    public string? DocumentUrl { get; private set; }    // for Pdf
    public string? Transcript { get; private set; }     // subtitle / full text
    public int PassScore { get; private set; } = 70;    // for Quiz
    public int DurationMinutes { get; private set; }    // estimated (non-video)

    // Navigation
    public CourseModule Module { get; private set; } = null!;
    public SessionVideoAsset? VideoAsset { get; private set; }
    public ICollection<Segment> Segments { get; private set; } = [];
    public ICollection<SessionProgress> Progresses { get; private set; } = [];

    private Session() { }

    public static Session Create(Guid moduleId, string title, string? description, int orderIndex,
        bool isFreeTrial = false, SessionType sessionType = SessionType.Interactive)
        => new()
        {
            Id = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = title.Trim(),
            Description = description?.Trim(),
            OrderIndex = orderIndex,
            IsFreeTrial = isFreeTrial,
            SessionType = sessionType,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string title, string? description, bool isFreeTrial, string? thumbnailUrl,
        SessionType? sessionType = null, string? content = null, string? audioUrl = null,
        string? documentUrl = null, string? transcript = null, int passScore = 70,
        int durationMinutes = 0)
    {
        Title = title.Trim();
        Description = description?.Trim();
        IsFreeTrial = isFreeTrial;
        ThumbnailUrl = thumbnailUrl;
        if (sessionType.HasValue) SessionType = sessionType.Value;
        Content = content?.Trim();
        AudioUrl = audioUrl?.Trim();
        DocumentUrl = documentUrl?.Trim();
        Transcript = transcript?.Trim();
        PassScore = passScore;
        DurationMinutes = durationMinutes;
        SetUpdatedAt();
    }

    public void SetOrder(int orderIndex) { OrderIndex = orderIndex; SetUpdatedAt(); }

    public void SetVideo(Guid videoAssetId, int durationSeconds, string? thumbnailUrl)
    {
        VideoAssetId = videoAssetId;
        DurationSeconds = durationSeconds;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        SetUpdatedAt();
    }

    public void Publish() { PublishStatus = SessionPublishStatus.Published; SetUpdatedAt(); }
    public void Unpublish() { PublishStatus = SessionPublishStatus.Draft; SetUpdatedAt(); }
}
