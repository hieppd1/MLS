using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Sessions.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record SessionVideoDto(
    Guid Id,
    string Status,
    string? HlsPath,
    string? ThumbnailUrl,
    int DurationSeconds
);

public record SegmentAssetDto(
    Guid Id,
    string Type,
    string Title,
    string? Description,
    int StartTime,
    int? EndTime,
    int OrderIndex,
    string Metadata,
    bool IsPublic
);

public record SegmentSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    int StartTime,
    int EndTime,
    int Duration,
    int OrderIndex,
    List<SegmentAssetDto> Assets
);

public record SessionDetailDto(
    Guid Id,
    Guid ModuleId,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsFreeTrial,
    string PublishStatus,
    string SessionType,
    string? ThumbnailUrl,
    int DurationSeconds,
    int DurationMinutes,
    int PassScore,
    string? Content,
    string? AudioUrl,
    string? DocumentUrl,
    string? Transcript,
    SessionVideoDto? VideoAsset,
    List<SegmentSummaryDto> Segments
);

public record SessionListItemDto(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsFreeTrial,
    string PublishStatus,
    string SessionType,
    string? ThumbnailUrl,
    int DurationSeconds,
    int SegmentCount,
    string? VideoStatus
);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetSessionDetailQuery(Guid SessionId) : IRequest<SessionDetailDto?>;

public class GetSessionDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionDetailQuery, SessionDetailDto?>
{
    public async Task<SessionDetailDto?> Handle(GetSessionDetailQuery request, CancellationToken ct)
    {
        var session = await db.Sessions
            .Include(s => s.VideoAsset)
            .Include(s => s.Segments.OrderBy(seg => seg.OrderIndex))
                .ThenInclude(seg => seg.Assets.OrderBy(a => a.OrderIndex))
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct);

        if (session == null) return null;

        return MapToDetail(session);
    }

    public static SessionDetailDto MapToDetail(Session session)
        => new(
            session.Id,
            session.ModuleId,
            session.Title,
            session.Description,
            session.OrderIndex,
            session.IsFreeTrial,
            session.PublishStatus.ToString(),
            session.SessionType.ToString(),
            session.ThumbnailUrl,
            session.DurationSeconds,
            session.DurationMinutes,
            session.PassScore,
            session.Content,
            session.AudioUrl,
            session.DocumentUrl,
            session.Transcript,
            session.VideoAsset == null ? null : new SessionVideoDto(
                session.VideoAsset.Id,
                session.VideoAsset.Status.ToString(),
                session.VideoAsset.HlsPath,
                session.VideoAsset.ThumbnailUrl,
                session.VideoAsset.DurationSeconds
            ),
            session.Segments.Select(seg => new SegmentSummaryDto(
                seg.Id, seg.Title, seg.Description, seg.StartTime, seg.EndTime,
                seg.EndTime - seg.StartTime,
                seg.OrderIndex,
                seg.Assets.Select(a => new SegmentAssetDto(
                    a.Id, a.Type.ToString(), a.Title, a.Description,
                    a.StartTime, a.EndTime, a.OrderIndex, a.Metadata, a.IsPublic
                )).ToList()
            )).ToList()
        );
}

// ── List Sessions by Module ───────────────────────────────────────────────────

public record GetSessionsByModuleQuery(Guid ModuleId) : IRequest<List<SessionListItemDto>>;

public class GetSessionsByModuleQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionsByModuleQuery, List<SessionListItemDto>>
{
    public async Task<List<SessionListItemDto>> Handle(GetSessionsByModuleQuery request, CancellationToken ct)
    {
        var sessions = await db.Sessions
            .Where(s => s.ModuleId == request.ModuleId)
            .Include(s => s.VideoAsset)
            .Include(s => s.Segments)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync(ct);

        return sessions.Select(s => new SessionListItemDto(
            s.Id, s.Title, s.Description, s.OrderIndex, s.IsFreeTrial,
            s.PublishStatus.ToString(), s.SessionType.ToString(), s.ThumbnailUrl, s.DurationSeconds,
            s.Segments.Count,
            s.VideoAsset?.Status.ToString()
        )).ToList();
    }
}
