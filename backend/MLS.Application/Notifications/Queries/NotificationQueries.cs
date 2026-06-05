using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.Notifications.Queries;

// ─────────────────────────────────────────────────────────────────────────────
// List notifications (paginated)
// ─────────────────────────────────────────────────────────────────────────────

public record NotificationDto(
    Guid Id, string Type, string Title, string Body, string? LinkUrl, bool IsRead, DateTime CreatedAt);

public record NotificationPageDto(IReadOnlyList<NotificationDto> Items, int UnreadCount, int Total);

public record GetNotificationsQuery(Guid UserId, int Page, int PageSize) : IRequest<NotificationPageDto>;

public class GetNotificationsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetNotificationsQuery, NotificationPageDto>
{
    public async Task<NotificationPageDto> Handle(GetNotificationsQuery req, CancellationToken ct)
    {
        var query = db.Notifications
            .Where(n => n.UserId == req.UserId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync(ct);
        var unread = await db.Notifications.CountAsync(n => n.UserId == req.UserId && !n.IsRead, ct);

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Body, n.LinkUrl, n.IsRead, n.CreatedAt))
            .ToListAsync(ct);

        return new NotificationPageDto(items, unread, total);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Unread count
// ─────────────────────────────────────────────────────────────────────────────

public record GetUnreadCountQuery(Guid UserId) : IRequest<int>;

public class GetUnreadCountQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetUnreadCountQuery, int>
{
    public Task<int> Handle(GetUnreadCountQuery req, CancellationToken ct)
        => db.Notifications.CountAsync(n => n.UserId == req.UserId && !n.IsRead, ct);
}
