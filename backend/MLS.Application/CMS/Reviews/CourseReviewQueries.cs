using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Reviews;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record ReviewUserDto(Guid Id, string Name, string? AvatarUrl);

public record ReviewDto(
    Guid Id,
    Guid CourseId,
    ReviewUserDto User,
    int Rating,
    string? Title,
    string Content,
    bool IsVerifiedPurchase,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record ReviewStatsDto(
    double AverageRating,
    int TotalReviews,
    Dictionary<int, int> Distribution);   // key = star (1-5), value = count

// ── Get Reviews ───────────────────────────────────────────────────────────────

public record GetCourseReviewsQuery(Guid CourseId, int Page = 1, int PageSize = 10) : IRequest<(List<ReviewDto>, int)>;

public class GetCourseReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseReviewsQuery, (List<ReviewDto>, int)>
{
    public async Task<(List<ReviewDto>, int)> Handle(GetCourseReviewsQuery q, CancellationToken ct)
    {
        var baseQuery = db.CourseReviews
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .Where(r => r.CourseId == q.CourseId)
            .OrderByDescending(r => r.CreatedAt);

        var total = await baseQuery.CountAsync(ct);
        var items = await baseQuery
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        return (items.Select(MapDto).ToList(), total);
    }

    public static ReviewDto MapDto(CourseReview r) => new(
        r.Id, r.CourseId,
        new ReviewUserDto(r.User.Id, r.User.Profile?.FullName ?? r.User.Email, r.User.Profile?.AvatarUrl),
        r.Rating, r.Title, r.Content, r.IsVerifiedPurchase,
        r.CreatedAt, r.UpdatedAt);
}

// ── Get Stats ─────────────────────────────────────────────────────────────────

public record GetReviewStatsQuery(Guid CourseId) : IRequest<ReviewStatsDto>;

public class GetReviewStatsHandler(IApplicationDbContext db)
    : IRequestHandler<GetReviewStatsQuery, ReviewStatsDto>
{
    public async Task<ReviewStatsDto> Handle(GetReviewStatsQuery q, CancellationToken ct)
    {
        var reviews = await db.CourseReviews
            .Where(r => r.CourseId == q.CourseId)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        if (reviews.Count == 0)
            return new ReviewStatsDto(0, 0, new() { {1,0},{2,0},{3,0},{4,0},{5,0} });

        var dist = Enumerable.Range(1, 5)
            .ToDictionary(s => s, s => reviews.Count(r => r == s));

        return new ReviewStatsDto(
            Math.Round(reviews.Average(), 1),
            reviews.Count,
            dist);
    }
}

// ── Get My Review ─────────────────────────────────────────────────────────────

public record GetMyReviewQuery(Guid CourseId, Guid UserId) : IRequest<ReviewDto?>;

public class GetMyReviewHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyReviewQuery, ReviewDto?>
{
    public async Task<ReviewDto?> Handle(GetMyReviewQuery q, CancellationToken ct)
    {
        var r = await db.CourseReviews
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(r => r.CourseId == q.CourseId && r.UserId == q.UserId, ct);
        return r == null ? null : GetCourseReviewsHandler.MapDto(r);
    }
}
