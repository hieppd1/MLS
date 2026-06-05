using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Segments.Commands;

// ── Create Segment ────────────────────────────────────────────────────────────

public record CreateSegmentCommand(
    Guid SessionId,
    string Title,
    string? Description,
    int StartTime,
    int EndTime
) : IRequest<Guid>;

public class CreateSegmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateSegmentCommand, Guid>
{
    public async Task<Guid> Handle(CreateSegmentCommand request, CancellationToken ct)
    {
        // Overlap check: no other segment in session should overlap [StartTime, EndTime]
        var overlapping = await db.Segments
            .Where(s => s.SessionId == request.SessionId
                && s.StartTime < request.EndTime
                && s.EndTime > request.StartTime)
            .AnyAsync(ct);

        if (overlapping)
            throw new ConflictException(
                $"Segment time range [{request.StartTime}–{request.EndTime}s] overlaps with an existing segment.");

        var orderIndex = await db.Segments
            .Where(s => s.SessionId == request.SessionId)
            .CountAsync(ct);

        // Domain validates: endTime > startTime, startTime >= 0
        var segment = Segment.Create(
            request.SessionId, request.Title, request.Description,
            request.StartTime, request.EndTime, orderIndex);

        db.Segments.Add(segment);
        await db.SaveChangesAsync(ct);
        return segment.Id;
    }
}

// ── Update Segment ────────────────────────────────────────────────────────────

public record UpdateSegmentCommand(
    Guid SegmentId,
    string Title,
    string? Description,
    int StartTime,
    int EndTime
) : IRequest;

public class UpdateSegmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateSegmentCommand>
{
    public async Task Handle(UpdateSegmentCommand request, CancellationToken ct)
    {
        var segment = await db.Segments.FindAsync([request.SegmentId], ct)
            ?? throw new NotFoundException(nameof(Segment), request.SegmentId);

        // Overlap check: exclude self
        var overlapping = await db.Segments
            .Where(s => s.SessionId == segment.SessionId
                && s.Id != request.SegmentId
                && s.StartTime < request.EndTime
                && s.EndTime > request.StartTime)
            .AnyAsync(ct);

        if (overlapping)
            throw new ConflictException(
                $"Segment time range [{request.StartTime}–{request.EndTime}s] overlaps with an existing segment.");

        // Domain validates: endTime > startTime, startTime >= 0
        segment.Update(request.Title, request.Description, request.StartTime, request.EndTime);
        await db.SaveChangesAsync(ct);
    }
}

// ── Delete Segment ────────────────────────────────────────────────────────────

public record DeleteSegmentCommand(Guid SegmentId) : IRequest;

public class DeleteSegmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteSegmentCommand>
{
    public async Task Handle(DeleteSegmentCommand request, CancellationToken ct)
    {
        var segment = await db.Segments.FindAsync([request.SegmentId], ct)
            ?? throw new NotFoundException(nameof(Segment), request.SegmentId);

        db.Segments.Remove(segment);
        await db.SaveChangesAsync(ct);
    }
}

// ── Reorder Segments ──────────────────────────────────────────────────────────

public record ReorderSegmentsCommand(Guid SessionId, List<Guid> OrderedIds) : IRequest;

public class ReorderSegmentsCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ReorderSegmentsCommand>
{
    public async Task Handle(ReorderSegmentsCommand request, CancellationToken ct)
    {
        var segments = await db.Segments
            .Where(s => s.SessionId == request.SessionId)
            .ToListAsync(ct);

        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            var segment = segments.FirstOrDefault(s => s.Id == request.OrderedIds[i]);
            segment?.SetOrder(i);
        }

        await db.SaveChangesAsync(ct);
    }
}


