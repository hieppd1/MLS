using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.QA.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// Create comment / reply
// ─────────────────────────────────────────────────────────────────────────────

public record CreateLessonCommentCommand(
    Guid AuthorId,
    Guid? LessonId,
    Guid? SessionId,
    string Content,
    Guid? ParentId
) : IRequest<LessonCommentDto>;

public record LessonCommentDto(
    Guid Id,
    Guid AuthorId,
    string? AuthorName,
    string? AuthorAvatarUrl,
    Guid? ParentId,
    string Content,
    int UpvoteCount,
    bool IsUpvotedByMe,
    bool IsPinned,
    bool IsDeleted,
    DateTime CreatedAt,
    List<LessonCommentDto> Replies
);

public class CreateLessonCommentCommandHandler(
    IApplicationDbContext db,
    IInAppNotificationService inAppNotifier,
    ITenantContext tenant) : IRequestHandler<CreateLessonCommentCommand, LessonCommentDto>
{
    public async Task<LessonCommentDto> Handle(CreateLessonCommentCommand req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            throw new InvalidOperationException("Nội dung không được rỗng.");

        if (req.LessonId == null && req.SessionId == null)
            throw new InvalidOperationException("Cần chỉ định LessonId hoặc SessionId.");

        // Validate parent exists and is top-level (no nesting beyond 1 level)
        if (req.ParentId.HasValue)
        {
            var parent = await db.LessonComments.FirstOrDefaultAsync(
                c => c.Id == req.ParentId.Value && !c.IsDeleted, ct)
                ?? throw new KeyNotFoundException("Bình luận cha không tồn tại.");
            if (parent.ParentId.HasValue)
                throw new InvalidOperationException("Chỉ hỗ trợ reply 1 cấp.");
        }

        var comment = req.LessonId.HasValue
            ? LessonComment.CreateForLesson(req.LessonId.Value, req.AuthorId, req.Content, req.ParentId)
            : LessonComment.CreateForSession(req.SessionId!.Value, req.AuthorId, req.Content, req.ParentId);

        db.LessonComments.Add(comment);
        await db.SaveChangesAsync(ct);

        // Notify parent author if this is a reply
        if (req.ParentId.HasValue)
        {
            var parent = await db.LessonComments.FirstOrDefaultAsync(c => c.Id == req.ParentId.Value, ct);
            if (parent != null && parent.AuthorId != req.AuthorId)
            {
                string lessonName;
                string lessonUrl;
                if (req.LessonId.HasValue)
                {
                    var lesson = await db.Sessions.FirstOrDefaultAsync(s => s.Id == req.LessonId.Value, ct);
                    lessonName = lesson?.Title ?? "bài học";
                    lessonUrl = $"/learn/{req.LessonId}";
                }
                else
                {
                    var session = await db.Sessions.FirstOrDefaultAsync(s => s.Id == req.SessionId!.Value, ct);
                    lessonName = session?.Title ?? "buổi học";
                    lessonUrl = $"/sessions/{req.SessionId}";
                }

                _ = inAppNotifier.NotifyAsync(
                    tenant.TenantSlug, parent.AuthorId, "QAReply",
                    "Có trả lời cho câu hỏi của bạn",
                    $"Câu hỏi của bạn trong \"{lessonName}\" có trả lời mới.",
                    lessonUrl, ct);
            }
        }

        // Return DTO from saved entity. AuthorName is resolved by list queries;
        // the creating user knows their own display name client-side.
        return new LessonCommentDto(
            comment.Id,
            comment.AuthorId,
            AuthorName: null!,
            AuthorAvatarUrl: null,
            comment.ParentId,
            comment.Content,
            comment.UpvoteCount,
            IsUpvotedByMe: false,
            comment.IsPinned,
            comment.IsDeleted,
            comment.CreatedAt,
            Replies: new List<LessonCommentDto>());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete (soft)
// ─────────────────────────────────────────────────────────────────────────────

public record DeleteLessonCommentCommand(Guid CommentId, Guid ActorId, string ActorRole) : IRequest;

public class DeleteLessonCommentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLessonCommentCommand>
{
    public async Task Handle(DeleteLessonCommentCommand req, CancellationToken ct)
    {
        var comment = await db.LessonComments.FirstOrDefaultAsync(c => c.Id == req.CommentId, ct)
            ?? throw new KeyNotFoundException("Bình luận không tồn tại.");

        var isAdminOrTeacher = req.ActorRole is "Admin" or "SuperAdmin" or "Teacher";
        if (comment.AuthorId != req.ActorId && !isAdminOrTeacher)
            throw new UnauthorizedAccessException("Bạn không có quyền xoá bình luận này.");

        comment.SoftDelete();
        await db.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upvote (toggle)
// ─────────────────────────────────────────────────────────────────────────────

public record ToggleUpvoteCommand(Guid CommentId, Guid UserId) : IRequest<bool>;

public class ToggleUpvoteCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleUpvoteCommand, bool>
{
    public async Task<bool> Handle(ToggleUpvoteCommand req, CancellationToken ct)
    {
        var comment = await db.LessonComments.FirstOrDefaultAsync(c => c.Id == req.CommentId && !c.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Bình luận không tồn tại.");

        var existing = await db.LessonCommentUpvotes
            .FirstOrDefaultAsync(u => u.CommentId == req.CommentId && u.UserId == req.UserId, ct);

        bool upvoted;
        if (existing != null)
        {
            db.LessonCommentUpvotes.Remove(existing);
            comment.DecrementUpvote();
            upvoted = false;
        }
        else
        {
            db.LessonCommentUpvotes.Add(LessonCommentUpvote.Create(req.CommentId, req.UserId));
            comment.IncrementUpvote();
            upvoted = true;
        }

        await db.SaveChangesAsync(ct);
        return upvoted;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pin / Unpin
// ─────────────────────────────────────────────────────────────────────────────

public record TogglePinCommand(Guid CommentId, Guid ActorId, string ActorRole) : IRequest<bool>;

public class TogglePinCommandHandler(IApplicationDbContext db)
    : IRequestHandler<TogglePinCommand, bool>
{
    public async Task Handle(TogglePinCommand req, CancellationToken ct) { }

    async Task<bool> IRequestHandler<TogglePinCommand, bool>.Handle(TogglePinCommand req, CancellationToken ct)
    {
        var isAdminOrTeacher = req.ActorRole is "Admin" or "SuperAdmin" or "Teacher";
        if (!isAdminOrTeacher)
            throw new UnauthorizedAccessException("Chỉ giáo viên/admin mới được ghim bình luận.");

        var comment = await db.LessonComments.FirstOrDefaultAsync(c => c.Id == req.CommentId && !c.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Bình luận không tồn tại.");

        comment.TogglePin();
        await db.SaveChangesAsync(ct);
        return comment.IsPinned;
    }
}
