using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class SegmentProgress : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid SegmentId { get; private set; }
    public bool IsViewed { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime? ViewedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // Navigation
    public Segment Segment { get; private set; } = null!;

    private SegmentProgress() { }

    public static SegmentProgress Create(Guid userId, Guid segmentId)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SegmentId = segmentId,
            CreatedAt = DateTime.UtcNow,
        };

    public void MarkViewed()
    {
        if (!IsViewed)
        {
            IsViewed = true;
            ViewedAt = DateTime.UtcNow;
            SetUpdatedAt();
        }
    }

    public void MarkCompleted()
    {
        IsViewed = true;
        IsCompleted = true;
        ViewedAt ??= DateTime.UtcNow;
        CompletedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
