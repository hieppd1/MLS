using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Chat.Queries;

public record SupportMessageDto(
    Guid Id,
    Guid ConversationId,
    Guid SenderId,
    string SenderRole,
    string Type,
    string? Content,
    string? FileUrl, string? FileName, string? MimeType, long? SizeBytes,
    DateTime CreatedAt);

public record SupportConversationDto(
    Guid Id,
    Guid StudentId,
    Guid? SupportUserId,
    string Status,
    DateTime? LastMessageAt,
    DateTime CreatedAt);

public record GetSupportConversationQuery(Guid ConversationId, Guid ActorId, bool IsSupportAgent)
    : IRequest<SupportConversationDto>;

public class GetSupportConversationQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSupportConversationQuery, SupportConversationDto>
{
    public async Task<SupportConversationDto> Handle(GetSupportConversationQuery req, CancellationToken ct)
    {
        var c = await db.SupportConversations.FirstOrDefaultAsync(x => x.Id == req.ConversationId, ct)
            ?? throw new KeyNotFoundException("Hội thoại không tồn tại.");
        if (!req.IsSupportAgent && c.StudentId != req.ActorId)
            throw new UnauthorizedAccessException();
        return new SupportConversationDto(c.Id, c.StudentId, c.SupportUserId, c.Status.ToString(), c.LastMessageAt, c.CreatedAt);
    }
}

public record GetSupportMessagesQuery(Guid ConversationId, Guid ActorId, bool IsSupportAgent, int Limit)
    : IRequest<IReadOnlyList<SupportMessageDto>>;

public class GetSupportMessagesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSupportMessagesQuery, IReadOnlyList<SupportMessageDto>>
{
    public async Task<IReadOnlyList<SupportMessageDto>> Handle(GetSupportMessagesQuery req, CancellationToken ct)
    {
        var c = await db.SupportConversations.FirstOrDefaultAsync(x => x.Id == req.ConversationId, ct)
            ?? throw new KeyNotFoundException("Hội thoại không tồn tại.");
        if (!req.IsSupportAgent && c.StudentId != req.ActorId)
            throw new UnauthorizedAccessException();

        var limit = req.Limit is > 0 and <= 200 ? req.Limit : 100;
        var msgs = await db.SupportMessages
            .Where(m => m.ConversationId == req.ConversationId)
            .OrderByDescending(m => m.CreatedAt).Take(limit)
            .ToListAsync(ct);
        msgs.Reverse();

        return msgs.Select(m => new SupportMessageDto(
            m.Id, m.ConversationId, m.SenderId, m.SenderRole.ToString(),
            m.Type.ToString(), m.Content,
            m.FileUrl, m.FileName, m.MimeType, m.SizeBytes,
            m.CreatedAt)).ToList();
    }
}

public record SupportInboxItemDto(
    Guid Id, Guid StudentId, Guid? SupportUserId, string Status,
    DateTime? LastMessageAt, DateTime CreatedAt, string? LastMessagePreview, int UnreadFromStudent);

public record GetSupportInboxQuery(SupportConversationStatus? Status, Guid? AssignedTo, int Page, int PageSize)
    : IRequest<IReadOnlyList<SupportInboxItemDto>>;

public class GetSupportInboxQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSupportInboxQuery, IReadOnlyList<SupportInboxItemDto>>
{
    public async Task<IReadOnlyList<SupportInboxItemDto>> Handle(GetSupportInboxQuery req, CancellationToken ct)
    {
        var page = req.Page < 1 ? 1 : req.Page;
        var size = req.PageSize is > 0 and <= 100 ? req.PageSize : 20;

        var q = db.SupportConversations.AsQueryable();
        if (req.Status.HasValue) q = q.Where(c => c.Status == req.Status.Value);
        if (req.AssignedTo.HasValue) q = q.Where(c => c.SupportUserId == req.AssignedTo.Value);

        var convs = await q
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .Skip((page - 1) * size).Take(size)
            .ToListAsync(ct);

        var ids = convs.Select(c => c.Id).ToList();
        var lastMsgs = await db.SupportMessages
            .Where(m => ids.Contains(m.ConversationId))
            .GroupBy(m => m.ConversationId)
            .Select(g => g.OrderByDescending(x => x.CreatedAt).First())
            .ToListAsync(ct);

        return convs.Select(c =>
        {
            var lm = lastMsgs.FirstOrDefault(m => m.ConversationId == c.Id);
            return new SupportInboxItemDto(
                c.Id, c.StudentId, c.SupportUserId, c.Status.ToString(),
                c.LastMessageAt, c.CreatedAt,
                lm?.Content, 0); // unread tracking can come later
        }).ToList();
    }
}
