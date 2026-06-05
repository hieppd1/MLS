using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.CMS.Sessions.Queries;

namespace MLS.Application.Learning.Queries;

// ── Get Session for Learning (public — includes progress if userId provided) ──

public record GetSessionForLearningQuery(Guid SessionId, Guid? UserId) : IRequest<SessionLearningDto?>;

public record SegmentProgressDto(bool IsViewed, bool IsCompleted);
public record SessionProgressSummaryDto(string Status, int LastPositionSeconds, double WatchPercentage);

public record SegmentLearningDto(
    Guid Id,
    string Title,
    string? Description,
    int StartTime,
    int EndTime,
    int Duration,
    int OrderIndex,
    SegmentProgressDto? Progress,
    List<SegmentAssetDto> Assets
);

public record SessionLearningDto(
    Guid Id,
    Guid ModuleId,
    string Title,
    string? Description,
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
    List<SegmentLearningDto> Segments,
    SessionProgressSummaryDto? Progress
);

public class GetSessionForLearningQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionForLearningQuery, SessionLearningDto?>
{
    public async Task<SessionLearningDto?> Handle(GetSessionForLearningQuery request, CancellationToken ct)
    {
        var session = await db.Sessions
            .Include(s => s.VideoAsset)
            .Include(s => s.Segments.OrderBy(seg => seg.OrderIndex))
                .ThenInclude(seg => seg.Assets.OrderBy(a => a.OrderIndex))
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, ct);

        if (session == null) return null;

        // Fetch user progress in parallel if userId provided
        List<MLS.Domain.Entities.SegmentProgress> segmentProgresses = [];
        MLS.Domain.Entities.SessionProgress? sessionProgress = null;

        if (request.UserId.HasValue)
        {
            var segmentIds = session.Segments.Select(s => s.Id).ToList();
            segmentProgresses = await db.SegmentProgresses
                .Where(p => p.UserId == request.UserId.Value && segmentIds.Contains(p.SegmentId))
                .ToListAsync(ct);

            sessionProgress = await db.SessionProgresses
                .FirstOrDefaultAsync(p => p.UserId == request.UserId.Value && p.SessionId == request.SessionId, ct);
        }

        var segments = session.Segments.Select(seg =>
        {
            var segProg = segmentProgresses.FirstOrDefault(p => p.SegmentId == seg.Id);
            return new SegmentLearningDto(
                seg.Id, seg.Title, seg.Description, seg.StartTime, seg.EndTime,
                seg.EndTime - seg.StartTime,
                seg.OrderIndex,
                segProg == null ? null : new SegmentProgressDto(segProg.IsViewed, segProg.IsCompleted),
                seg.Assets
                    .Where(a => a.IsPublic)
                    .Select(a => new SegmentAssetDto(
                        a.Id, a.Type.ToString(), a.Title, a.Description,
                        a.StartTime, a.EndTime, a.OrderIndex, a.Metadata, a.IsPublic
                    )).ToList()
            );
        }).ToList();

        return new SessionLearningDto(
            session.Id, session.ModuleId, session.Title, session.Description,
            session.IsFreeTrial, session.PublishStatus.ToString(),
            session.SessionType.ToString(),
            session.ThumbnailUrl, session.DurationSeconds, session.DurationMinutes,
            session.PassScore, session.Content, session.AudioUrl, session.DocumentUrl,
            session.Transcript,
            session.VideoAsset == null ? null : new SessionVideoDto(
                session.VideoAsset.Id, session.VideoAsset.Status.ToString(),
                session.VideoAsset.HlsPath, session.VideoAsset.ThumbnailUrl,
                session.VideoAsset.DurationSeconds),
            segments,
            sessionProgress == null ? null : new SessionProgressSummaryDto(
                sessionProgress.Status.ToString(),
                sessionProgress.LastPositionSeconds,
                sessionProgress.WatchPercentage)
        );
    }
}
