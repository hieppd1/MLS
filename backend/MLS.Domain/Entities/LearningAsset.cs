using MLS.Domain.Common;

namespace MLS.Domain.Entities;

// Business rules: startTime >= 0, endTime >= startTime if provided.
// startTime must be within owning segment [startTime, endTime] (enforced at handler level).

public enum LearningAssetType
{
    GrammarBlock,
    VocabularyBlock,
    QuizBlock,
    ExerciseBlock,
    PPTBlock,
    NoteBlock,
    FileAttachment
}

public class LearningAsset : BaseEntity
{
    public Guid SegmentId { get; private set; }
    public LearningAssetType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int StartTime { get; private set; }   // seconds — timestamp to jump-to on video
    public int? EndTime { get; private set; }    // seconds — optional end of highlight range
    public int OrderIndex { get; private set; }
    public string Metadata { get; private set; } = "{}";   // JSONB — type-specific data
    public bool IsPublic { get; private set; } = true;

    // Navigation
    public Segment Segment { get; private set; } = null!;
    public ICollection<LearningAssetInteraction> Interactions { get; private set; } = [];

    private LearningAsset() { }

    public static LearningAsset Create(Guid segmentId, LearningAssetType type, string title,
        string? description, int startTime, int? endTime, int orderIndex,
        string metadata = "{}", bool isPublic = true)
    {
        if (startTime < 0)
            throw new DomainException("Asset startTime must be >= 0.");
        if (endTime.HasValue && endTime.Value < startTime)
            throw new DomainException("Asset endTime must be >= startTime.");
        return new()
        {
            Id = Guid.NewGuid(),
            SegmentId = segmentId,
            Type = type,
            Title = title.Trim(),
            Description = description?.Trim(),
            StartTime = startTime,
            EndTime = endTime,
            OrderIndex = orderIndex,
            Metadata = string.IsNullOrWhiteSpace(metadata) ? "{}" : metadata,
            IsPublic = isPublic,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Update(string title, string? description, int startTime, int? endTime,
        string metadata, bool isPublic)
    {
        if (startTime < 0)
            throw new DomainException("Asset startTime must be >= 0.");
        if (endTime.HasValue && endTime.Value < startTime)
            throw new DomainException("Asset endTime must be >= startTime.");
        Title = title.Trim();
        Description = description?.Trim();
        StartTime = startTime;
        EndTime = endTime;
        Metadata = string.IsNullOrWhiteSpace(metadata) ? "{}" : metadata;
        IsPublic = isPublic;
        SetUpdatedAt();
    }

    public void SetOrder(int orderIndex) { OrderIndex = orderIndex; SetUpdatedAt(); }
}
