using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.CMS.Sessions.Commands;

// ── Create Session ────────────────────────────────────────────────────────────

public record CreateSessionCommand(
    Guid ModuleId,
    string Title,
    string? Description,
    bool IsFreeTrial = false,
    string? ThumbnailUrl = null,
    string SessionType = "Interactive",
    string? Content = null,
    string? AudioUrl = null,
    string? DocumentUrl = null,
    string? Transcript = null,
    int PassScore = 70,
    int DurationMinutes = 0
) : IRequest<Guid>;

public class CreateSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateSessionCommand, Guid>
{
    public async Task<Guid> Handle(CreateSessionCommand request, CancellationToken ct)
    {
        var orderIndex = await db.Sessions
            .Where(s => s.ModuleId == request.ModuleId)
            .CountAsync(ct);

        Enum.TryParse<MLS.Domain.Entities.SessionType>(request.SessionType, ignoreCase: true, out var sessionType);

        var session = Session.Create(request.ModuleId, request.Title, request.Description, orderIndex,
            request.IsFreeTrial, sessionType);

        session.Update(session.Title, session.Description, session.IsFreeTrial, request.ThumbnailUrl,
            sessionType, request.Content, request.AudioUrl, request.DocumentUrl,
            request.Transcript, request.PassScore, request.DurationMinutes);

        db.Sessions.Add(session);

        // For non-Interactive types, auto-create a single default segment
        if (sessionType != MLS.Domain.Entities.SessionType.Interactive)
        {
            var segment = MLS.Domain.Entities.Segment.Create(session.Id, "Nội dung chính", null, 0, 0, 0);
            db.Segments.Add(segment);
        }

        await db.SaveChangesAsync(ct);
        return session.Id;
    }
}

// ── Update Session ────────────────────────────────────────────────────────────

public record UpdateSessionCommand(
    Guid SessionId,
    string Title,
    string? Description,
    bool IsFreeTrial,
    string? ThumbnailUrl,
    string? SessionType = null,
    string? Content = null,
    string? AudioUrl = null,
    string? DocumentUrl = null,
    string? Transcript = null,
    int PassScore = 70,
    int DurationMinutes = 0
) : IRequest;

public class UpdateSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateSessionCommand>
{
    public async Task Handle(UpdateSessionCommand request, CancellationToken ct)
    {
        var session = await db.Sessions.FindAsync([request.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {request.SessionId} not found");

        MLS.Domain.Entities.SessionType? sessionType = null;
        if (request.SessionType != null && Enum.TryParse<MLS.Domain.Entities.SessionType>(request.SessionType, ignoreCase: true, out var parsed))
            sessionType = parsed;

        session.Update(request.Title, request.Description, request.IsFreeTrial, request.ThumbnailUrl,
            sessionType, request.Content, request.AudioUrl, request.DocumentUrl,
            request.Transcript, request.PassScore, request.DurationMinutes);
        await db.SaveChangesAsync(ct);
    }
}

// ── Delete Session ────────────────────────────────────────────────────────────

public record DeleteSessionCommand(Guid SessionId) : IRequest;

public class DeleteSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteSessionCommand>
{
    public async Task Handle(DeleteSessionCommand request, CancellationToken ct)
    {
        var session = await db.Sessions.FindAsync([request.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {request.SessionId} not found");

        db.Sessions.Remove(session);
        await db.SaveChangesAsync(ct);
    }
}

// ── Publish / Unpublish Session ───────────────────────────────────────────────

public record PublishSessionCommand(Guid SessionId, bool Publish) : IRequest;

public class PublishSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<PublishSessionCommand>
{
    public async Task Handle(PublishSessionCommand request, CancellationToken ct)
    {
        var session = await db.Sessions.FindAsync([request.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {request.SessionId} not found");

        if (request.Publish) session.Publish(); else session.Unpublish();
        await db.SaveChangesAsync(ct);
    }
}

// ── Reorder Sessions ──────────────────────────────────────────────────────────

public record ReorderSessionsCommand(Guid ModuleId, List<Guid> OrderedIds) : IRequest;

public class ReorderSessionsCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ReorderSessionsCommand>
{
    public async Task Handle(ReorderSessionsCommand request, CancellationToken ct)
    {
        var sessions = await db.Sessions
            .Where(s => s.ModuleId == request.ModuleId)
            .ToListAsync(ct);

        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            var session = sessions.FirstOrDefault(s => s.Id == request.OrderedIds[i]);
            session?.SetOrder(i);
        }

        await db.SaveChangesAsync(ct);
    }
}

// ── Upload Video for Session ──────────────────────────────────────────────────

public record CreateSessionVideoAssetCommand(
    Guid SessionId,
    string OriginalFileName,
    long SizeBytes,
    Stream FileStream,
    string ContentType,
    string TenantSlug) : IRequest<Guid>;

public class CreateSessionVideoAssetCommandHandler(
    IApplicationDbContext db,
    IStorageService storage)
    : IRequestHandler<CreateSessionVideoAssetCommand, Guid>
{
    public async Task<Guid> Handle(CreateSessionVideoAssetCommand request, CancellationToken ct)
    {
        var session = await db.Sessions
            .Include(s => s.VideoAsset)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {request.SessionId} not found");

        // Reuse existing or create new
        SessionVideoAsset asset;
        if (session.VideoAsset != null)
        {
            asset = session.VideoAsset;
            asset.Reset(request.OriginalFileName, request.SizeBytes);
        }
        else
        {
            asset = SessionVideoAsset.Create(request.SessionId, request.OriginalFileName, request.SizeBytes);
            db.SessionVideoAssets.Add(asset);
            await db.SaveChangesAsync(ct); // need ID before linking
            session.SetVideo(asset.Id, 0, null);
        }

        var safeFileName = $"{asset.Id}{Path.GetExtension(request.OriginalFileName)}";
        var storedPath = await storage.UploadAsync(
            request.TenantSlug, "session-videos", safeFileName, request.FileStream, request.ContentType, ct);

        asset.SetReady(storedPath, null, 0);
        await db.SaveChangesAsync(ct);
        return asset.Id;
    }
}
