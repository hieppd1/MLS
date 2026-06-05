using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.Notifications.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// Mark read
// ─────────────────────────────────────────────────────────────────────────────

public record MarkNotificationsReadCommand(Guid UserId, IReadOnlyList<Guid>? Ids, bool All) : IRequest;

public class MarkNotificationsReadCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MarkNotificationsReadCommand>
{
    public async Task Handle(MarkNotificationsReadCommand req, CancellationToken ct)
    {
        IQueryable<MLS.Domain.Entities.Notification> query = db.Notifications
            .Where(n => n.UserId == req.UserId && !n.IsRead);

        if (!req.All && req.Ids is { Count: > 0 })
            query = query.Where(n => req.Ids.Contains(n.Id));

        var items = await query.ToListAsync(ct);
        foreach (var n in items) n.MarkRead();
        await db.SaveChangesAsync(ct);
    }
}
