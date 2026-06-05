using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.Learning.Commands;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CommentDto(
    Guid Id,
    Guid SessionId,
    Guid? SegmentId,
    Guid UserId,
    string UserName,
    string? UserAvatar,
    Guid? ParentCommentId,
    string Content,
    int TimestampSecond,
    int LikeCount,
    bool IsPinned,
    string Status,
    DateTime CreatedAt,
    List<CommentDto> Replies,
    bool UserHasLiked = false);

// ── Create Comment ────────────────────────────────────────────────────────────

public record CreateCommentCommand(
    Guid UserId,
    Guid SessionId,
    Guid? SegmentId,
    string Content,
    int TimestampSecond,
    Guid? ParentCommentId) : IRequest<CommentDto>;

public class CreateCommentHandler(IApplicationDbContext db)
    : IRequestHandler<CreateCommentCommand, CommentDto>
{
    public async Task<CommentDto> Handle(CreateCommentCommand cmd, CancellationToken ct)
    {
        // Validate session exists
        var sessionExists = await db.Sessions.AnyAsync(s => s.Id == cmd.SessionId, ct);
        if (!sessionExists) throw new NotFoundException("Session", cmd.SessionId);

        // Validate parent comment if replying
        if (cmd.ParentCommentId.HasValue)
        {
            var parentExists = await db.VideoComments
                .AnyAsync(c => c.Id == cmd.ParentCommentId.Value && c.SessionId == cmd.SessionId, ct);
            if (!parentExists) throw new NotFoundException("ParentComment", cmd.ParentCommentId.Value);
        }

        var comment = VideoComment.Create(
            cmd.SessionId, cmd.SegmentId, cmd.UserId,
            cmd.ParentCommentId, cmd.Content, cmd.TimestampSecond);

        db.VideoComments.Add(comment);
        await db.SaveChangesAsync(ct);

        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == cmd.UserId, ct);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == cmd.UserId, ct);
        return MapDto(comment, user, profile, []);
    }

    internal static CommentDto MapDto(VideoComment c, User? user, UserProfile? profile, List<CommentDto> replies, bool liked = false) =>
        new(c.Id, c.SessionId, c.SegmentId, c.UserId,
            profile?.FullName ?? user?.Email ?? "Unknown", profile?.AvatarUrl,
            c.ParentCommentId, c.Content, c.TimestampSecond,
            c.LikeCount, c.IsPinned, c.Status.ToString(), c.CreatedAt,
            replies, liked);
}

// ── Update Comment ────────────────────────────────────────────────────────────

public record UpdateCommentCommand(Guid UserId, Guid CommentId, string Content) : IRequest<CommentDto>;

public class UpdateCommentHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCommentCommand, CommentDto>
{
    public async Task<CommentDto> Handle(UpdateCommentCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        if (comment.UserId != cmd.UserId) throw new ForbiddenException("Cannot edit another user's comment.");
        if (comment.Status == CommentStatus.Deleted) throw new DomainException("Comment has been deleted.");

        comment.Update(cmd.Content);
        await db.SaveChangesAsync(ct);

        var user = await db.Users.FindAsync([cmd.UserId], ct);
        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == cmd.UserId, ct);
        return CreateCommentHandler.MapDto(comment, user, profile, []);
    }
}

// ── Delete Comment ────────────────────────────────────────────────────────────

public record DeleteCommentCommand(Guid UserId, Guid CommentId, bool IsAdmin = false) : IRequest<Unit>;

public class DeleteCommentHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCommentCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCommentCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        if (!cmd.IsAdmin && comment.UserId != cmd.UserId)
            throw new ForbiddenException("Cannot delete another user's comment.");

        comment.SoftDelete();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Toggle Like ───────────────────────────────────────────────────────────────

public record ToggleLikeCommand(Guid UserId, Guid CommentId) : IRequest<int>;

public class ToggleLikeHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleLikeCommand, int>
{
    public async Task<int> Handle(ToggleLikeCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        var reaction = await db.CommentReactions.FirstOrDefaultAsync(
            r => r.CommentId == cmd.CommentId && r.UserId == cmd.UserId, ct);

        if (reaction == null)
        {
            db.CommentReactions.Add(CommentReaction.Create(cmd.CommentId, cmd.UserId, ReactionType.Like));
            comment.IncrementLike();
        }
        else
        {
            db.CommentReactions.Remove(reaction);
            comment.DecrementLike();
        }

        await db.SaveChangesAsync(ct);
        return comment.LikeCount;
    }
}

// ── Pin / Unpin Comment ───────────────────────────────────────────────────────

public record PinCommentCommand(Guid CommentId, bool Pin) : IRequest<Unit>;

public class PinCommentHandler(IApplicationDbContext db)
    : IRequestHandler<PinCommentCommand, Unit>
{
    public async Task<Unit> Handle(PinCommentCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        if (cmd.Pin) comment.Pin(); else comment.Unpin();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Report Comment ────────────────────────────────────────────────────────────

public record ReportCommentCommand(Guid UserId, Guid CommentId) : IRequest<Unit>;

public class ReportCommentHandler(IApplicationDbContext db)
    : IRequestHandler<ReportCommentCommand, Unit>
{
    public async Task<Unit> Handle(ReportCommentCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        comment.Report();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Hide Comment (admin) ──────────────────────────────────────────────────────

public record HideCommentCommand(Guid CommentId) : IRequest<Unit>;

public class HideCommentHandler(IApplicationDbContext db)
    : IRequestHandler<HideCommentCommand, Unit>
{
    public async Task<Unit> Handle(HideCommentCommand cmd, CancellationToken ct)
    {
        var comment = await db.VideoComments.FindAsync([cmd.CommentId], ct)
            ?? throw new NotFoundException("VideoComment", cmd.CommentId);

        comment.Hide();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
