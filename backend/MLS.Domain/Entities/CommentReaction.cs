using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ReactionType { Like, Dislike }

public class CommentReaction : BaseEntity
{
    public Guid CommentId { get; private set; }
    public Guid UserId { get; private set; }
    public ReactionType ReactionType { get; private set; }

    public VideoComment Comment { get; private set; } = null!;

    private CommentReaction() { }

    public static CommentReaction Create(Guid commentId, Guid userId, ReactionType reactionType)
        => new()
        {
            Id = Guid.NewGuid(),
            CommentId = commentId,
            UserId = userId,
            ReactionType = reactionType,
            CreatedAt = DateTime.UtcNow,
        };
}
