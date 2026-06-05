using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Teacher.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record MyTeacherCourseItem(
    Guid Id,
    string Title,
    string? ShortDescription,
    string? ThumbnailUrl,
    int Level,
    string Status,
    decimal Price,
    decimal? DiscountPrice,
    bool IsFree,
    string? Slug,
    int ModuleCount,
    int EnrollmentCount,
    DateTime CreatedAt);

public record OPICAnalyticsSkillScores(
    decimal AvgPronunciation,
    decimal AvgFluency,
    decimal AvgCoherence,
    decimal AvgVocabulary,
    decimal AvgTaskAchievement);

public record OPICTeacherAnalyticsDto(
    int TotalSessions,
    int CompletedSessions,
    Dictionary<string, int> LevelDistribution,
    decimal AvgOverallScore,
    OPICAnalyticsSkillScores SkillScores);

public record OPICStudentResultItem(
    Guid UserId,
    string UserName,
    string AssignedLevel,
    decimal OverallScore,
    decimal PronunciationScore,
    decimal FluencyScore,
    decimal CoherenceScore,
    decimal VocabularyScore,
    decimal TaskAchievementScore,
    string Language,
    DateTime TestedAt);

public record PagedOPICStudentResults(
    List<OPICStudentResultItem> Items,
    int Total,
    int Page,
    int PageSize);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetMyTeacherCoursesQuery(Guid UserId) : IRequest<List<MyTeacherCourseItem>>;
public record GetOPICTeacherAnalyticsQuery() : IRequest<OPICTeacherAnalyticsDto>;
public record GetOPICStudentResultsQuery(int Page = 1, int PageSize = 20) : IRequest<PagedOPICStudentResults>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetMyTeacherCoursesHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyTeacherCoursesQuery, List<MyTeacherCourseItem>>
{
    public async Task<List<MyTeacherCourseItem>> Handle(GetMyTeacherCoursesQuery q, CancellationToken ct)
    {
        // Find TeacherProfile for this user
        var teacherProfile = await db.TeacherProfiles.AsNoTracking()
            .FirstOrDefaultAsync(tp => tp.UserId == q.UserId, ct);

        var query = db.Courses.AsNoTracking()
            .Include(c => c.Modules)
            .Include(c => c.Enrollments)
            .AsQueryable();

        if (teacherProfile != null)
            // Courses created by this user OR assigned to their teacher profile
            query = query.Where(c => c.CreatedBy == q.UserId || c.TeacherId == teacherProfile.Id);
        else
            // No teacher profile yet — only courses they created
            query = query.Where(c => c.CreatedBy == q.UserId);

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new MyTeacherCourseItem(
                c.Id,
                c.Title,
                c.ShortDescription,
                c.ThumbnailUrl,
                c.Level,
                c.Status.ToString(),
                c.Price,
                c.DiscountPrice,
                c.IsFree,
                c.Slug,
                c.Modules.Count,
                c.Enrollments.Count,
                c.CreatedAt))
            .ToListAsync(ct);
    }
}

public class GetOPICTeacherAnalyticsHandler(IApplicationDbContext db)
    : IRequestHandler<GetOPICTeacherAnalyticsQuery, OPICTeacherAnalyticsDto>
{
    private static readonly string[] AllLevels = ["NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

    public async Task<OPICTeacherAnalyticsDto> Handle(GetOPICTeacherAnalyticsQuery q, CancellationToken ct)
    {
        var totalSessions    = await db.OPICSessions.CountAsync(ct);
        var completedSessions = await db.OPICSessions.CountAsync(s => s.IsCompleted, ct);

        var results = await db.OPICLevelResults.AsNoTracking().ToListAsync(ct);

        // Level distribution
        var dist = AllLevels.ToDictionary(l => l, _ => 0);
        foreach (var r in results)
            if (dist.ContainsKey(r.AssignedLevel))
                dist[r.AssignedLevel]++;

        // Avg scores
        decimal avgOverall = results.Count > 0
            ? Math.Round(results.Average(r => r.OverallScore), 2) : 0;

        var skills = results.Count > 0
            ? new OPICAnalyticsSkillScores(
                Math.Round(results.Average(r => r.PronunciationScore), 2),
                Math.Round(results.Average(r => r.FluencyScore), 2),
                Math.Round(results.Average(r => r.CoherenceScore), 2),
                Math.Round(results.Average(r => r.VocabularyScore), 2),
                Math.Round(results.Average(r => r.TaskAchievementScore), 2))
            : new OPICAnalyticsSkillScores(0, 0, 0, 0, 0);

        return new OPICTeacherAnalyticsDto(totalSessions, completedSessions, dist, avgOverall, skills);
    }
}

public class GetOPICStudentResultsHandler(IApplicationDbContext db)
    : IRequestHandler<GetOPICStudentResultsQuery, PagedOPICStudentResults>
{
    public async Task<PagedOPICStudentResults> Handle(GetOPICStudentResultsQuery q, CancellationToken ct)
    {
        var total = await db.OPICLevelResults.CountAsync(ct);

        var results = await db.OPICLevelResults.AsNoTracking()
            .OrderByDescending(r => r.TestedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        if (results.Count == 0)
            return new PagedOPICStudentResults([], total, q.Page, q.PageSize);

        var userIds = results.Select(r => r.UserId).Distinct().ToList();
        var profiles = await db.UserProfiles.AsNoTracking()
            .Where(p => userIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.FullName, ct);

        var items = results.Select(r => new OPICStudentResultItem(
            r.UserId,
            profiles.TryGetValue(r.UserId, out var name) ? name : r.UserId.ToString()[..8],
            r.AssignedLevel,
            r.OverallScore,
            r.PronunciationScore,
            r.FluencyScore,
            r.CoherenceScore,
            r.VocabularyScore,
            r.TaskAchievementScore,
            r.Language,
            r.TestedAt)).ToList();

        return new PagedOPICStudentResults(items, total, q.Page, q.PageSize);
    }
}
