using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Application.VSTEP.Commands;
using Microsoft.EntityFrameworkCore;
using MLS.Domain.Entities;

namespace MLS.Application.VSTEP.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PassageGroupDto(
    Guid    Id,
    Guid    QuizId,
    int     GroupIndex,
    string  PassageType,
    string? PassageText,
    string? AudioUrl,
    int     AudioPlayLimit,
    int     PreListenSeconds,
    Guid[]  QuestionIds,
    int     DisplayOrder);

public record VSTEPQuizSummaryDto(
    Guid   Id,
    string Title,
    string? Description,
    string QuizType,
    int?   Duration);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetVSTEPSessionQuery(Guid SessionId, Guid UserId) : IRequest<VSTEPSessionDto?>;

public class GetVSTEPSessionHandler(IApplicationDbContext db)
    : IRequestHandler<GetVSTEPSessionQuery, VSTEPSessionDto?>
{
    public async Task<VSTEPSessionDto?> Handle(GetVSTEPSessionQuery q, CancellationToken ct)
    {
        var session = await db.VSTEPSessions.FirstOrDefaultAsync(
            s => s.Id == q.SessionId && s.UserId == q.UserId, ct);
        return session is null ? null : VSTEPCommandsHelpers.ToDtoQ(session);
    }
}

public record GetMyVSTEPSessionsQuery(Guid UserId, int Page = 1, int PageSize = 10)
    : IRequest<List<VSTEPSessionDto>>;

public class GetMyVSTEPSessionsHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyVSTEPSessionsQuery, List<VSTEPSessionDto>>
{
    public async Task<List<VSTEPSessionDto>> Handle(GetMyVSTEPSessionsQuery q, CancellationToken ct)
    {
        var sessions = await db.VSTEPSessions
            .Where(s => s.UserId == q.UserId)
            .OrderByDescending(s => s.StartedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);
        return sessions.Select(VSTEPCommandsHelpers.ToDtoQ).ToList();
    }
}

public record GetVSTEPBandResultQuery(Guid SessionId) : IRequest<VSTEPBandResultDto?>;

public class GetVSTEPBandResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetVSTEPBandResultQuery, VSTEPBandResultDto?>
{
    public async Task<VSTEPBandResultDto?> Handle(GetVSTEPBandResultQuery q, CancellationToken ct)
    {
        var r = await db.VSTEPBandResults.FirstOrDefaultAsync(x => x.SessionId == q.SessionId, ct);
        return r is null ? null : new VSTEPBandResultDto(
            r.Id, r.AssignedBand, r.AssignedLevel,
            r.ListeningScore, r.ReadingScore, r.WritingScore, r.SpeakingScore,
            r.OverallScore, r.TestedAt);
    }
}

public record GetMyLatestVSTEPResultQuery(Guid UserId) : IRequest<VSTEPBandResultDto?>;

public class GetMyLatestVSTEPResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyLatestVSTEPResultQuery, VSTEPBandResultDto?>
{
    public async Task<VSTEPBandResultDto?> Handle(GetMyLatestVSTEPResultQuery q, CancellationToken ct)
    {
        var r = await db.VSTEPBandResults
            .Where(x => x.UserId == q.UserId)
            .OrderByDescending(x => x.TestedAt)
            .FirstOrDefaultAsync(ct);
        return r is null ? null : new VSTEPBandResultDto(
            r.Id, r.AssignedBand, r.AssignedLevel,
            r.ListeningScore, r.ReadingScore, r.WritingScore, r.SpeakingScore,
            r.OverallScore, r.TestedAt);
    }
}

public record GetPassageGroupsQuery(Guid QuizId) : IRequest<List<PassageGroupDto>>;

public class GetPassageGroupsHandler(IApplicationDbContext db)
    : IRequestHandler<GetPassageGroupsQuery, List<PassageGroupDto>>
{
    public async Task<List<PassageGroupDto>> Handle(GetPassageGroupsQuery q, CancellationToken ct)
    {
        var groups = await db.PassageGroups
            .Where(g => g.QuizId == q.QuizId)
            .OrderBy(g => g.DisplayOrder).ThenBy(g => g.GroupIndex)
            .ToListAsync(ct);
        return groups.Select(ToDto).ToList();
    }

    private static PassageGroupDto ToDto(PassageGroup g)
    {
        Guid[] qids = [];
        try { qids = System.Text.Json.JsonSerializer.Deserialize<Guid[]>(g.QuestionIds) ?? []; }
        catch { /* ignore */ }
        return new PassageGroupDto(g.Id, g.QuizId, g.GroupIndex, g.PassageType,
            g.PassageText, g.AudioUrl, g.AudioPlayLimit, g.PreListenSeconds, qids, g.DisplayOrder);
    }
}

public record GetPublishedVSTEPQuizzesQuery(string QuizType) : IRequest<List<VSTEPQuizSummaryDto>>;

public class GetPublishedVSTEPQuizzesHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublishedVSTEPQuizzesQuery, List<VSTEPQuizSummaryDto>>
{
    public async Task<List<VSTEPQuizSummaryDto>> Handle(GetPublishedVSTEPQuizzesQuery q, CancellationToken ct)
    {
        if (!Enum.TryParse<QuizType>(q.QuizType, out var quizType))
            quizType = QuizType.VSTEPMockTest;

        var quizzes = await db.Quizzes
            .Where(x => x.Status == QuizStatus.Published
                     && x.ExamMode == ExamMode.VSTEP
                     && x.QuizType == quizType)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new VSTEPQuizSummaryDto(x.Id, x.Title, x.Description, x.QuizType.ToString(), x.Duration))
            .ToListAsync(ct);
        return quizzes;
    }
}
