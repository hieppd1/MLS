using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.QA.Commands;

namespace MLS.Application.QA.Queries;

public record GetLessonCommentsQuery(Guid? LessonId, Guid? SessionId, Guid? CurrentUserId, Guid? Cursor, int Limit) : IRequest<LessonCommentsPageDto>;

public record LessonCommentsPageDto(IReadOnlyList<LessonCommentDto> Items, Guid? NextCursor);

public class GetLessonCommentsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLessonCommentsQuery, LessonCommentsPageDto>
{
    public async Task<LessonCommentsPageDto> Handle(GetLessonCommentsQuery req, CancellationToken ct)
    {
        // Get top-level comments (pinned first, then newest first)
        IQueryable<MLS.Domain.Entities.LessonComment> baseQuery = db.LessonComments
            .Include(c => c.Author).ThenInclude(a => a.Profile)
            .Where(c => !c.IsDeleted && c.ParentId == null);

        if (req.LessonId.HasValue)
            baseQuery = baseQuery.Where(c => c.LessonId == req.LessonId.Value);
        else if (req.SessionId.HasValue)
            baseQuery = baseQuery.Where(c => c.SessionId == req.SessionId.Value);

        if (req.Cursor.HasValue)
        {
            var cursorComment = await db.LessonComments.FindAsync([req.Cursor.Value], ct);
            if (cursorComment != null)
                baseQuery = baseQuery.Where(c => c.CreatedAt < cursorComment.CreatedAt || (c.CreatedAt == cursorComment.CreatedAt && c.Id != req.Cursor.Value));
        }

        var rawTopLevel = await baseQuery
            .OrderByDescending(c => c.IsPinned)
            .ThenByDescending(c => c.CreatedAt)
            .Take(req.Limit)
            .ToListAsync(ct);

        var topLevel = rawTopLevel.Select(c => new
            {
                c.Id,
                c.AuthorId,
                AuthorName = c.Author?.Profile?.FullName ?? c.Author?.Email ?? c.AuthorId.ToString(),
                AvatarUrl = c.Author?.Profile?.AvatarUrl,
                c.ParentId,
                c.Content,
                c.UpvoteCount,
                c.IsPinned,
                c.IsDeleted,
                c.CreatedAt,
            }).ToList();

        // Get upvotes for current user
        var topIds = topLevel.Select(c => c.Id).ToList();
        HashSet<Guid> myUpvotes = new();
        if (req.CurrentUserId.HasValue)
        {
            var upvotedIds = await db.LessonCommentUpvotes
                .Where(u => u.UserId == req.CurrentUserId.Value && topIds.Contains(u.CommentId))
                .Select(u => u.CommentId)
                .ToListAsync(ct);
            myUpvotes = [..upvotedIds];
        }

        // Get first 3 replies for each top-level comment
        var rawReplies = await db.LessonComments
            .Include(c => c.Author).ThenInclude(a => a.Profile)
            .Where(c => !c.IsDeleted && c.ParentId != null && topIds.Contains(c.ParentId.Value))
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(ct);

        var replies = rawReplies.Select(c => new
        {
            c.Id,
            c.AuthorId,
            AuthorName = c.Author?.Profile?.FullName ?? c.Author?.Email ?? c.AuthorId.ToString(),
            AvatarUrl = c.Author?.Profile?.AvatarUrl,
            c.ParentId,
            c.Content,
            c.UpvoteCount,
            c.IsPinned,
            c.IsDeleted,
            c.CreatedAt,
        }).ToList();

        var replyMap = replies.GroupBy(r => r.ParentId!.Value)
            .ToDictionary(g => g.Key, g => g.Take(3).ToList());

        HashSet<Guid> myReplyUpvotes = new();
        if (req.CurrentUserId.HasValue)
        {
            var replyIds = replies.Select(r => r.Id).ToList();
            var upvotedReplyIds = await db.LessonCommentUpvotes
                .Where(u => u.UserId == req.CurrentUserId.Value && replyIds.Contains(u.CommentId))
                .Select(u => u.CommentId)
                .ToListAsync(ct);
            myReplyUpvotes = [..upvotedReplyIds];
        }

        var items = topLevel.Select(c => new LessonCommentDto(
            c.Id, c.AuthorId, c.AuthorName, c.AvatarUrl,
            c.ParentId, c.Content, c.UpvoteCount,
            myUpvotes.Contains(c.Id), c.IsPinned, c.IsDeleted, c.CreatedAt,
            replyMap.TryGetValue(c.Id, out var repList)
                ? repList.Select(r => new LessonCommentDto(
                    r.Id, r.AuthorId, r.AuthorName, r.AvatarUrl,
                    r.ParentId, r.Content, r.UpvoteCount,
                    myReplyUpvotes.Contains(r.Id), r.IsPinned, r.IsDeleted, r.CreatedAt,
                    new List<LessonCommentDto>())).ToList()
                : new List<LessonCommentDto>()
        )).ToList();

        Guid? nextCursor = topLevel.Count == req.Limit ? topLevel.LastOrDefault()?.Id : null;
        return new LessonCommentsPageDto(items, nextCursor);
    }
}
