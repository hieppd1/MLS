using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Chat.Queries;

public record ChatAttachmentDto(
    Guid Id, string FileUrl, string FileName, string? MimeType, long SizeBytes, int? Width, int? Height);

public record ChatMessageDto(
    Guid Id,
    Guid GroupId,
    Guid SenderId,
    string Type,
    string? Content,
    Guid? ReplyToId,
    bool IsDeleted,
    DateTime CreatedAt,
    IReadOnlyList<ChatAttachmentDto> Attachments
);

public record ChatMessagePageDto(
    IReadOnlyList<ChatMessageDto> Items,
    string? NextCursor
);

/// <summary>
/// Cursor pagination: cursor = "ticks_messageId". Returns messages OLDER than cursor.
/// Latest page (cursor=null) returns the newest `Limit` messages.
/// Items are returned in ascending CreatedAt order (oldest first) so the UI can append.
/// </summary>
public record GetChatMessagesQuery(
    Guid GroupId,
    Guid UserId,
    string? Cursor,
    int Limit
) : IRequest<ChatMessagePageDto>;

public class GetChatMessagesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetChatMessagesQuery, ChatMessagePageDto>
{
    public async Task<ChatMessagePageDto> Handle(GetChatMessagesQuery req, CancellationToken ct)
    {
        var member = await db.ChatGroupMembers.AnyAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.UserId &&
            m.Status == ChatGroupMemberStatus.Approved, ct);
        if (!member) throw new UnauthorizedAccessException("Bạn không phải thành viên nhóm.");

        var limit = req.Limit is > 0 and <= 100 ? req.Limit : 50;

        var query = db.ChatMessages.Where(m => m.GroupId == req.GroupId);

        if (!string.IsNullOrEmpty(req.Cursor) && TryParseCursor(req.Cursor, out var ticks, out var id))
        {
            var cursorAt = new DateTime(ticks, DateTimeKind.Utc);
            query = query.Where(m => m.CreatedAt < cursorAt ||
                (m.CreatedAt == cursorAt && m.Id.CompareTo(id) < 0));
        }

        var page = await query
            .OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id)
            .Take(limit + 1)
            .ToListAsync(ct);

        string? nextCursor = null;
        if (page.Count > limit)
        {
            var last = page[limit - 1];
            nextCursor = $"{last.CreatedAt.Ticks}_{last.Id}";
            page = page.Take(limit).ToList();
        }

        var msgIds = page.Select(m => m.Id).ToList();
        var attachments = await db.ChatMessageAttachments
            .Where(a => msgIds.Contains(a.MessageId))
            .ToListAsync(ct);

        // Return ascending (oldest first)
        page.Reverse();

        var items = page.Select(m => new ChatMessageDto(
            m.Id, m.GroupId, m.SenderId,
            m.Type.ToString(),
            m.IsDeleted ? null : m.Content,
            m.ReplyToId, m.IsDeleted, m.CreatedAt,
            attachments.Where(a => a.MessageId == m.Id)
                .Select(a => new ChatAttachmentDto(a.Id, a.FileUrl, a.FileName, a.MimeType, a.SizeBytes, a.Width, a.Height))
                .ToList()
        )).ToList();

        return new ChatMessagePageDto(items, nextCursor);
    }

    private static bool TryParseCursor(string cursor, out long ticks, out Guid id)
    {
        ticks = 0; id = Guid.Empty;
        var parts = cursor.Split('_', 2);
        return parts.Length == 2 &&
               long.TryParse(parts[0], out ticks) &&
               Guid.TryParse(parts[1], out id);
    }
}
