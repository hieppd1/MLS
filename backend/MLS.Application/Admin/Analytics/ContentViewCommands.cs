using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Analytics;

// ── Record a content view (fire-and-forget friendly) ─────────────────────────

public record RecordContentViewCommand(ContentViewType ContentType, Guid ContentId, Guid? UserId) : IRequest;

public class RecordContentViewHandler(IApplicationDbContext db)
    : IRequestHandler<RecordContentViewCommand>
{
    public async Task Handle(RecordContentViewCommand cmd, CancellationToken ct)
    {
        db.ContentViews.Add(ContentView.Record(cmd.ContentType, cmd.ContentId, cmd.UserId));
        await db.SaveChangesAsync(ct);
    }
}
