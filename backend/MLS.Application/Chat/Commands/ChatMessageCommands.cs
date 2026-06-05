using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Chat.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// Send message
// ─────────────────────────────────────────────────────────────────────────────

public record AttachmentInput(
    string FileUrl, string FileName, string? MimeType, long SizeBytes, int? Width, int? Height);

public record SendChatMessageCommand(
    Guid GroupId,
    Guid SenderId,
    ChatMessageType Type,
    string? Content,
    Guid? ReplyToId,
    IReadOnlyList<AttachmentInput>? Attachments
) : IRequest<Guid>;

public class SendChatMessageCommandHandler(
    IApplicationDbContext db,
    IChatNotificationService notifier,
    IInAppNotificationService inAppNotifier,
    ITenantContext tenant) : IRequestHandler<SendChatMessageCommand, Guid>
{
    public async Task<Guid> Handle(SendChatMessageCommand req, CancellationToken ct)
    {
        // Membership check (must be Approved)
        var member = await db.ChatGroupMembers
            .FirstOrDefaultAsync(m =>
                m.GroupId == req.GroupId &&
                m.UserId == req.SenderId &&
                m.Status == ChatGroupMemberStatus.Approved, ct)
            ?? throw new UnauthorizedAccessException("Bạn không phải thành viên nhóm.");

        if (req.Type == ChatMessageType.Text && string.IsNullOrWhiteSpace(req.Content))
            throw new InvalidOperationException("Nội dung không được rỗng.");

        if (req.ReplyToId.HasValue)
        {
            var exists = await db.ChatMessages
                .AnyAsync(m => m.Id == req.ReplyToId.Value && m.GroupId == req.GroupId && !m.IsDeleted, ct);
            if (!exists) throw new InvalidOperationException("Tin nhắn được reply không tồn tại.");
        }

        var msg = ChatMessage.Create(req.GroupId, req.SenderId, req.Type, req.Content?.Trim(), req.ReplyToId);
        db.ChatMessages.Add(msg);

        if (req.Attachments is { Count: > 0 })
        {
            foreach (var a in req.Attachments)
            {
                db.ChatMessageAttachments.Add(
                    ChatMessageAttachment.Create(msg.Id, a.FileUrl, a.FileName, a.MimeType, a.SizeBytes, a.Width, a.Height));
            }
        }

        await db.SaveChangesAsync(ct);

        var payload = new
        {
            id = msg.Id,
            groupId = msg.GroupId,
            senderId = msg.SenderId,
            type = msg.Type.ToString(),
            content = msg.Content,
            replyToId = msg.ReplyToId,
            createdAt = msg.CreatedAt,
            attachments = req.Attachments,
        };
        await notifier.NotifyGroupAsync(tenant.TenantSlug, req.GroupId, "MessageReceived", payload, ct);

        // In-app notification for all other approved members (fire-and-forget style)
        var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct);
        var groupName = group?.Name ?? "nhóm";
        var otherMemberIds = await db.ChatGroupMembers
            .Where(m => m.GroupId == req.GroupId && m.Status == ChatGroupMemberStatus.Approved && m.UserId != req.SenderId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        var preview = req.Content?.Length > 60 ? req.Content[..60] + "…" : req.Content ?? "[file]";
        foreach (var memberId in otherMemberIds)
        {
            _ = inAppNotifier.NotifyAsync(
                tenant.TenantSlug, memberId, "ChatMessage",
                $"Tin nhắn mới trong {groupName}",
                preview,
                $"/nhom?room={req.GroupId}", ct);
        }

        return msg.Id;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete (soft)
// ─────────────────────────────────────────────────────────────────────────────

public record DeleteChatMessageCommand(Guid GroupId, Guid MessageId, Guid ActorId) : IRequest;

public class DeleteChatMessageCommandHandler(
    IApplicationDbContext db,
    IChatNotificationService notifier,
    ITenantContext tenant) : IRequestHandler<DeleteChatMessageCommand>
{
    public async Task Handle(DeleteChatMessageCommand req, CancellationToken ct)
    {
        var msg = await db.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == req.MessageId && m.GroupId == req.GroupId, ct)
            ?? throw new KeyNotFoundException("Tin nhắn không tồn tại.");

        if (msg.SenderId != req.ActorId)
        {
            var actor = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
                m.GroupId == req.GroupId && m.UserId == req.ActorId &&
                m.Status == ChatGroupMemberStatus.Approved, ct)
                ?? throw new UnauthorizedAccessException("Bạn không thuộc nhóm.");
            if (actor.Role is not (ChatGroupMemberRole.Owner or ChatGroupMemberRole.Moderator))
                throw new UnauthorizedAccessException("Không có quyền xoá tin nhắn của người khác.");
        }

        msg.SoftDelete();
        await db.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(tenant.TenantSlug, req.GroupId, "MessageDeleted",
            new { id = msg.Id, groupId = msg.GroupId }, ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark read
// ─────────────────────────────────────────────────────────────────────────────

public record MarkChatReadCommand(Guid GroupId, Guid UserId, Guid LastMessageId) : IRequest;

public class MarkChatReadCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MarkChatReadCommand>
{
    public async Task Handle(MarkChatReadCommand req, CancellationToken ct)
    {
        var member = await db.ChatGroupMembers
            .FirstOrDefaultAsync(m =>
                m.GroupId == req.GroupId && m.UserId == req.UserId &&
                m.Status == ChatGroupMemberStatus.Approved, ct)
            ?? throw new UnauthorizedAccessException("Bạn không phải thành viên nhóm.");
        member.MarkRead(req.LastMessageId);
        await db.SaveChangesAsync(ct);
    }
}
