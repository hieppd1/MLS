using MLS.Domain.Common;

// Business rules: endTime > startTime, startTime >= 0.
// Overlap with other segments of same session is enforced at handler level.

namespace MLS.Domain.Entities;

public class Segment : BaseEntity
{
    public Guid SessionId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int StartTime { get; private set; }   // seconds
    public int EndTime { get; private set; }     // seconds
    public int OrderIndex { get; private set; }

    // Navigation
    public Session Session { get; private set; } = null!;
    public ICollection<LearningAsset> Assets { get; private set; } = [];
    public ICollection<SegmentProgress> Progresses { get; private set; } = [];

    private Segment() { }

    public static Segment Create(Guid sessionId, string title, string? description,
        int startTime, int endTime, int orderIndex)
    {
        if (startTime < 0)
            throw new DomainException("Segment startTime must be >= 0.");
        if (endTime <= startTime)
            throw new DomainException("Segment endTime must be greater than startTime.");
        return new()
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Title = title.Trim(),
            Description = description?.Trim(),
            StartTime = startTime,
            EndTime = endTime,
            OrderIndex = orderIndex,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Update(string title, string? description, int startTime, int endTime)
    {
        if (startTime < 0)
            throw new DomainException("Segment startTime must be >= 0.");
        if (endTime <= startTime)
            throw new DomainException("Segment endTime must be greater than startTime.");
        Title = title.Trim();
        Description = description?.Trim();
        StartTime = startTime;
        EndTime = endTime;
        SetUpdatedAt();
    }

    public void SetOrder(int orderIndex) { OrderIndex = orderIndex; SetUpdatedAt(); }
}
