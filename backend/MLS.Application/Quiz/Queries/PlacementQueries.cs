using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using System.Text.Json;

namespace MLS.Application.Quiz.Queries;

// ── Get Placement Quiz ────────────────────────────────────────────────────────

public record GetPlacementQuizQuery() : IRequest<QuizDetailDto?>;

public class GetPlacementQuizHandler(IApplicationDbContext db)
    : IRequestHandler<GetPlacementQuizQuery, QuizDetailDto?>
{
    public async Task<QuizDetailDto?> Handle(GetPlacementQuizQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(x => x.Questions.OrderBy(qq => qq.DisplayOrder))
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q2 => q2.Options.OrderBy(o => o.DisplayOrder))
            .Where(x => x.QuizType == QuizType.PlacementTest && x.Status == QuizStatus.Published)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (quiz == null) return null;

        var dto = GetQuizDetailHandler.MapToDetail(quiz);
        // Sanitise answers for learner
        return dto with
        {
            Questions = dto.Questions.Select(qq => qq with
            {
                Options = qq.Options.Select(o => o with { IsCorrect = false }).ToList()
            }).ToList()
        };
    }
}

// ── Get My Placement Result ───────────────────────────────────────────────────

public record GetMyPlacementResultQuery(Guid UserId) : IRequest<MyPlacementResultDto?>;

public record MyPlacementResultDto(
    Guid Id, int AssignedLevel, DateTime TestedAt,
    Dictionary<string, decimal> SkillBreakdown, string? RecommendedPath);

public class GetMyPlacementResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyPlacementResultQuery, MyPlacementResultDto?>
{
    public async Task<MyPlacementResultDto?> Handle(GetMyPlacementResultQuery q, CancellationToken ct)
    {
        var result = await db.PlacementResults
            .AsNoTracking()
            .Where(pr => pr.UserId == q.UserId)
            .OrderByDescending(pr => pr.TestedAt)
            .FirstOrDefaultAsync(ct);

        if (result == null) return null;

        var breakdown = result.SkillBreakdown != null
            ? JsonSerializer.Deserialize<Dictionary<string, decimal>>(result.SkillBreakdown)
              ?? new Dictionary<string, decimal>()
            : new Dictionary<string, decimal>();

        return new MyPlacementResultDto(
            result.Id, result.AssignedLevel, result.TestedAt,
            breakdown, result.RecommendedPath);
    }
}

// ── Get Recommended Courses ───────────────────────────────────────────────────

public record GetRecommendedCoursesQuery(Guid UserId, int Take = 6) : IRequest<List<RecommendedCourseDto>>;

public record RecommendedCourseDto(
    Guid Id, string Title, int Level, string? ThumbnailUrl,
    bool IsFree, decimal Price, int EnrollmentCount);

public class GetRecommendedCoursesHandler(IApplicationDbContext db)
    : IRequestHandler<GetRecommendedCoursesQuery, List<RecommendedCourseDto>>
{
    public async Task<List<RecommendedCourseDto>> Handle(GetRecommendedCoursesQuery q, CancellationToken ct)
    {
        // Find user's placement level
        var placement = await db.PlacementResults
            .AsNoTracking()
            .Where(pr => pr.UserId == q.UserId)
            .OrderByDescending(pr => pr.TestedAt)
            .FirstOrDefaultAsync(ct);

        var targetLevel = placement?.AssignedLevel ?? 1;

        // Recommend courses at target level and one level above
        return await db.Courses
            .AsNoTracking()
            .Where(c => (c.Level == targetLevel || c.Level == targetLevel + 1)
                     && c.Status == Domain.Entities.CourseStatus.Published)
            .OrderByDescending(c => c.Enrollments.Count)
            .Take(q.Take)
            .Select(c => new RecommendedCourseDto(
                c.Id, c.Title, c.Level, c.ThumbnailUrl,
                c.IsFree, c.Price,
                c.Enrollments.Count))
            .ToListAsync(ct);
    }
}
