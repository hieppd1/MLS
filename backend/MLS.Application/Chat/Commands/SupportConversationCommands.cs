using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Chat.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// Student: open or reuse an OPEN conversation
// ─────────────────────────────────────────────────────────────────────────────
public record OpenSupportConversationCommand(Guid StudentId) : IRequest<Guid>;

public class OpenSupportConversationCommandHandler(IApplicationDbContext db)
    : IRequestHandler<OpenSupportConversationCommand, Guid>
{
    public async Task<Guid> Handle(OpenSupportConversationCommand req, CancellationToken ct)
    {
        var existing = await db.SupportConversations
            .Where(c => c.StudentId == req.StudentId && c.Status == SupportConversationStatus.Open)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (existing is not null) return existing.Id;

        var conv = SupportConversation.Create(req.StudentId);
        db.SupportConversations.Add(conv);
        await db.SaveChangesAsync(ct);
        return conv.Id;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Send message (student or support)
// ─────────────────────────────────────────────────────────────────────────────
public record SendSupportMessageCommand(
    Guid ConversationId,
    Guid SenderId,
    SupportSenderRole SenderRole,
    ChatMessageType Type,
    string? Content,
    string? FileUrl,
    string? FileName,
    string? MimeType,
    long? SizeBytes
) : IRequest<Guid>;

public class SendSupportMessageCommandHandler(
    IApplicationDbContext db,
    IChatNotificationService notifier,
    ITenantContext tenant) : IRequestHandler<SendSupportMessageCommand, Guid>
{
    public async Task<Guid> Handle(SendSupportMessageCommand req, CancellationToken ct)
    {
        var conv = await db.SupportConversations.FirstOrDefaultAsync(c => c.Id == req.ConversationId, ct)
            ?? throw new KeyNotFoundException("Hội thoại không tồn tại.");
        if (conv.Status == SupportConversationStatus.Closed)
            throw new InvalidOperationException("Hội thoại đã đóng.");

        if (req.SenderRole == SupportSenderRole.Student && conv.StudentId != req.SenderId)
            throw new UnauthorizedAccessException("Không phải hội thoại của bạn.");

        if (req.Type == ChatMessageType.Text && string.IsNullOrWhiteSpace(req.Content))
            throw new InvalidOperationException("Nội dung không được rỗng.");

        var msg = SupportMessage.Create(conv.Id, req.SenderId, req.SenderRole, req.Type,
            req.Content?.Trim(), req.FileUrl, req.FileName, req.MimeType, req.SizeBytes);
        db.SupportMessages.Add(msg);

        var now = DateTime.UtcNow;
        conv.TouchLastMessage(now);

        // Auto-assign first support user that replies
        if (req.SenderRole == SupportSenderRole.Support && conv.SupportUserId is null)
            conv.Assign(req.SenderId);

        await db.SaveChangesAsync(ct);

        await notifier.NotifySupportAsync(tenant.TenantSlug, conv.Id, "SupportMessageReceived", new
        {
            id = msg.Id,
            conversationId = msg.ConversationId,
            senderId = msg.SenderId,
            senderRole = msg.SenderRole.ToString(),
            type = msg.Type.ToString(),
            content = msg.Content,
            fileUrl = msg.FileUrl,
            fileName = msg.FileName,
            mimeType = msg.MimeType,
            sizeBytes = msg.SizeBytes,
            createdAt = msg.CreatedAt,
        }, ct);

        return msg.Id;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign / Close
// ─────────────────────────────────────────────────────────────────────────────
public record AssignSupportConversationCommand(Guid ConversationId, Guid SupportUserId) : IRequest;

public class AssignSupportConversationCommandHandler(IApplicationDbContext db)
    : IRequestHandler<AssignSupportConversationCommand>
{
    public async Task Handle(AssignSupportConversationCommand req, CancellationToken ct)
    {
        var conv = await db.SupportConversations.FirstOrDefaultAsync(c => c.Id == req.ConversationId, ct)
            ?? throw new KeyNotFoundException("Hội thoại không tồn tại.");
        if (conv.Status == SupportConversationStatus.Closed)
            throw new InvalidOperationException("Hội thoại đã đóng.");
        conv.Assign(req.SupportUserId);
        await db.SaveChangesAsync(ct);
    }
}

public record CloseSupportConversationCommand(Guid ConversationId, Guid ActorId, bool IsSupportAgent) : IRequest;

public class CloseSupportConversationCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CloseSupportConversationCommand>
{
    public async Task Handle(CloseSupportConversationCommand req, CancellationToken ct)
    {
        var conv = await db.SupportConversations.FirstOrDefaultAsync(c => c.Id == req.ConversationId, ct)
            ?? throw new KeyNotFoundException("Hội thoại không tồn tại.");
        if (!req.IsSupportAgent && conv.StudentId != req.ActorId)
            throw new UnauthorizedAccessException("Không có quyền đóng hội thoại.");
        conv.Close();
        await db.SaveChangesAsync(ct);
    }
}
