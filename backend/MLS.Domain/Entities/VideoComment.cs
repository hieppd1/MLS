using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum CommentStatus { Active, Hidden, Reported, Deleted }

public class VideoComment : BaseEntity
{
    public Guid SessionId { get; private set; }
    public Guid? SegmentId { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? ParentCommentId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public int TimestampSecond { get; private set; }
    public int LikeCount { get; private set; }
    public bool IsPinned { get; private set; }
    public CommentStatus Status { get; private set; } = CommentStatus.Active;

    // Navigation
    public Session Session { get; private set; } = null!;
    public User User { get; private set; } = null!;
    public VideoComment? ParentComment { get; private set; }
    public ICollection<VideoComment> Replies { get; private set; } = [];
    public ICollection<CommentReaction> Reactions { get; private set; } = [];

    private VideoComment() { }

    public static VideoComment Create(
        Guid sessionId, Guid? segmentId, Guid userId,
        Guid? parentCommentId, string content, int timestampSecond)
        => new()
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            SegmentId = segmentId,
            UserId = userId,
            ParentCommentId = parentCommentId,
            Content = content.Trim(),
            TimestampSecond = timestampSecond,
            LikeCount = 0,
            IsPinned = false,
            Status = CommentStatus.Active,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string content) { Content = content.Trim(); SetUpdatedAt(); }
    public void IncrementLike() { LikeCount++; SetUpdatedAt(); }
    public void DecrementLike() { LikeCount = Math.Max(0, LikeCount - 1); SetUpdatedAt(); }
    public void Pin() { IsPinned = true; SetUpdatedAt(); }
    public void Unpin() { IsPinned = false; SetUpdatedAt(); }
    public void Report() { Status = CommentStatus.Reported; SetUpdatedAt(); }
    public void Hide() { Status = CommentStatus.Hidden; SetUpdatedAt(); }
    public void SoftDelete() { Status = CommentStatus.Deleted; SetUpdatedAt(); }
}
