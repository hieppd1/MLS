using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum LessonType { Video, Reading, Audio, Pdf, Quiz, Assignment, Live }
public enum LessonPublishStatus { Draft, Published, Hidden }

public class Lesson : BaseEntity
{
    public Guid ModuleId { get; private set; }
    public LessonType LessonType { get; private set; } = LessonType.Video;
    public LessonPublishStatus PublishStatus { get; private set; } = LessonPublishStatus.Draft;
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }    // short plain-text
    public string? Content { get; private set; }        // HTML for Reading/Assignment
    public string? ThumbnailUrl { get; private set; }
    public string? AudioUrl { get; private set; }       // for Audio lesson
    public string? DocumentUrl { get; private set; }    // for Pdf lesson
    public string? Transcript { get; private set; }     // subtitle / full text
    public int DurationMinutes { get; private set; }    // estimated duration
    public int OrderIndex { get; private set; }
    public bool IsFreeTrial { get; private set; }
    public int PassScore { get; private set; } = 70;

    public CourseModule Module { get; private set; } = null!;
    public VideoAsset? VideoAsset { get; private set; }
    public ICollection<LessonDocument> Documents { get; private set; } = [];
    public ICollection<LessonProgress> ProgressRecords { get; private set; } = [];

    private Lesson() { }

    public static Lesson Create(Guid moduleId, string title, string? description, int orderIndex, bool isFreeTrial = false)
        => new()
        {
            Id = Guid.NewGuid(),
            ModuleId = moduleId,
            LessonType = LessonType.Video,
            Title = title.Trim(),
            Description = description?.Trim(),
            OrderIndex = orderIndex,
            IsFreeTrial = isFreeTrial,
            CreatedAt = DateTime.UtcNow,
        };

    public static Lesson CreateWithType(Guid moduleId, string title, string? description,
        int orderIndex, bool isFreeTrial = false, LessonType lessonType = LessonType.Video,
        string? content = null)
        => new()
        {
            Id = Guid.NewGuid(),
            ModuleId = moduleId,
            LessonType = lessonType,
            Title = title.Trim(),
            Description = description?.Trim(),
            Content = content,
            OrderIndex = orderIndex,
            IsFreeTrial = isFreeTrial,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string title, string? description, int orderIndex, bool isFreeTrial, int passScore,
        LessonType? lessonType = null, string? content = null,
        string? thumbnailUrl = null, string? audioUrl = null, string? documentUrl = null,
        string? transcript = null, int durationMinutes = 0,
        LessonPublishStatus? publishStatus = null)
    {
        Title = title.Trim();
        Description = description?.Trim();
        Content = content?.Trim();
        ThumbnailUrl = thumbnailUrl?.Trim();
        AudioUrl = audioUrl?.Trim();
        DocumentUrl = documentUrl?.Trim();
        Transcript = transcript?.Trim();
        DurationMinutes = durationMinutes;
        OrderIndex = orderIndex;
        IsFreeTrial = isFreeTrial;
        PassScore = passScore;
        if (lessonType.HasValue) LessonType = lessonType.Value;
        if (publishStatus.HasValue) PublishStatus = publishStatus.Value;
        SetUpdatedAt();
    }
}
