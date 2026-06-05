using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class LessonComment : BaseEntity
{
    public Guid? LessonId { get; private set; }
    public Guid? SessionId { get; private set; }
    public Guid AuthorId { get; private set; }
    public Guid? ParentId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public int UpvoteCount { get; private set; }
    public bool IsDeleted { get; private set; }
    public bool IsPinned { get; private set; }

    public User Author { get; private set; } = null!;
    public LessonComment? Parent { get; private set; }
    public ICollection<LessonComment> Replies { get; private set; } = [];
    public ICollection<LessonCommentUpvote> Upvotes { get; private set; } = [];

    private LessonComment() { }

    public static LessonComment CreateForLesson(Guid lessonId, Guid authorId, string content, Guid? parentId = null)
        => new()
        {
            LessonId = lessonId,
            AuthorId = authorId,
            Content = content.Trim(),
            ParentId = parentId,
        };

    public static LessonComment CreateForSession(Guid sessionId, Guid authorId, string content, Guid? parentId = null)
        => new()
        {
            SessionId = sessionId,
            AuthorId = authorId,
            Content = content.Trim(),
            ParentId = parentId,
        };

    public void SoftDelete() { IsDeleted = true; SetUpdatedAt(); }
    public void TogglePin() { IsPinned = !IsPinned; SetUpdatedAt(); }
    public void IncrementUpvote() { UpvoteCount++; SetUpdatedAt(); }
    public void DecrementUpvote() { if (UpvoteCount > 0) UpvoteCount--; SetUpdatedAt(); }
}

public class LessonCommentUpvote
{
    public Guid CommentId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public LessonComment Comment { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private LessonCommentUpvote() { }

    public static LessonCommentUpvote Create(Guid commentId, Guid userId)
        => new()
        {
            CommentId = commentId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };
}
