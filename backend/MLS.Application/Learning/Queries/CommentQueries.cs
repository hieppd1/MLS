using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Learning.Commands;
using MLS.Domain.Entities;

namespace MLS.Application.Learning.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record CommentPageDto(
    List<CommentDto> Items,
    Guid? NextCursor,
    int Total);

// ── Get Session Comments (cursor-based pagination) ────────────────────────────

public record GetSessionCommentsQuery(
    Guid SessionId,
    Guid? CurrentUserId,
    Guid? Cursor,
    int PageSize = 20) : IRequest<CommentPageDto>;

public class GetSessionCommentsHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionCommentsQuery, CommentPageDto>
{
    public async Task<CommentPageDto> Handle(GetSessionCommentsQuery q, CancellationToken ct)
    {
        var query = db.VideoComments
            .Where(c => c.SessionId == q.SessionId
                && c.ParentCommentId == null
                && c.Status != CommentStatus.Deleted);

        var total = await query.CountAsync(ct);

        if (q.Cursor.HasValue)
        {
            var cursorComment = await db.VideoComments.FindAsync([q.Cursor.Value], ct);
            if (cursorComment != null)
                query = query.Where(c => c.CreatedAt < cursorComment.CreatedAt);
        }

        var rootComments = await query
            .OrderByDescending(c => c.IsPinned)
            .ThenByDescending(c => c.CreatedAt)
            .Take(q.PageSize)
            .ToListAsync(ct);

        if (rootComments.Count == 0)
            return new CommentPageDto([], null, total);

        // Load replies (1-level deep)
        var commentIds = rootComments.Select(c => c.Id).ToList();
        var replies = await db.VideoComments
            .Where(c => c.ParentCommentId != null
                && commentIds.Contains(c.ParentCommentId!.Value)
                && c.Status != CommentStatus.Deleted)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

        // Collect all relevant user ids
        var allUserIds = rootComments.Select(c => c.UserId)
            .Concat(replies.Select(c => c.UserId))
            .Distinct()
            .ToList();

        var users = await db.Users
            .Where(u => allUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, ct);

        var profiles = await db.UserProfiles
            .Where(p => allUserIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        // Load reactions for current user
        HashSet<Guid> likedByUser = [];
        if (q.CurrentUserId.HasValue)
        {
            var allIds = commentIds.Concat(replies.Select(c => c.Id)).ToList();
            var userLikes = await db.CommentReactions
                .Where(r => r.UserId == q.CurrentUserId.Value
                    && allIds.Contains(r.CommentId)
                    && r.ReactionType == ReactionType.Like)
                .Select(r => r.CommentId)
                .ToListAsync(ct);
            likedByUser = [..userLikes];
        }

        // Build reply map
        var replyMap = replies
            .GroupBy(r => r.ParentCommentId!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => CreateCommentHandler.MapDto(
                    r, users.GetValueOrDefault(r.UserId), profiles.GetValueOrDefault(r.UserId), [],
                    likedByUser.Contains(r.Id))).ToList());

        var dtos = rootComments.Select(c =>
            CreateCommentHandler.MapDto(
                c, users.GetValueOrDefault(c.UserId),
                profiles.GetValueOrDefault(c.UserId),
                replyMap.GetValueOrDefault(c.Id, []),
                likedByUser.Contains(c.Id))).ToList();

        Guid? nextCursor = rootComments.Count == q.PageSize ? rootComments[^1].Id : null;

        return new CommentPageDto(dtos, nextCursor, total);
    }
}
