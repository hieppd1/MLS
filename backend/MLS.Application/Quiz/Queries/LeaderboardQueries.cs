using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Queries;

public record LeaderboardEntryDto(
    int Rank,
    Guid UserId,
    string Name,
    string? AvatarUrl,
    int Done,
    int Total,
    int Pct);

public record GetQuizLeaderboardQuery(string Period, int Limit) : IRequest<List<LeaderboardEntryDto>>;

public class GetQuizLeaderboardHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizLeaderboardQuery, List<LeaderboardEntryDto>>
{
    public async Task<List<LeaderboardEntryDto>> Handle(GetQuizLeaderboardQuery q, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        DateTime since = q.Period?.ToLowerInvariant() switch
        {
            "month" => now.AddDays(-30),
            "year"  => now.AddDays(-365),
            _       => now.AddDays(-7),
        };

        var limit = q.Limit <= 0 ? 10 : Math.Min(q.Limit, 50);

        // Aggregate completed (submitted or graded) attempts per user in the period
        var stats = await db.QuizAttempts
            .AsNoTracking()
            .Where(a => (a.State == AttemptState.Submitted || a.State == AttemptState.Graded)
                        && a.SubmittedAt != null
                        && a.SubmittedAt >= since)
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Total  = g.Count(),
                Passed = g.Count(x => x.Passed),
            })
            .OrderByDescending(x => x.Total)
            .ThenByDescending(x => x.Passed)
            .Take(limit)
            .ToListAsync(ct);

        if (stats.Count == 0) return [];

        var userIds = stats.Select(s => s.UserId).ToList();

        var users = await db.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.Email,
                Profile = db.UserProfiles
                    .Where(p => p.UserId == u.Id)
                    .Select(p => new { p.FullName, p.AvatarUrl })
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        var userMap = users.ToDictionary(u => u.Id);

        return stats
            .Select((s, idx) =>
            {
                userMap.TryGetValue(s.UserId, out var u);
                var name = u?.Profile?.FullName;
                if (string.IsNullOrWhiteSpace(name))
                    name = u?.Email?.Split('@')[0] ?? "Học viên";
                var pct = s.Total == 0 ? 0 : (int)Math.Round((double)s.Passed * 100 / s.Total);
                return new LeaderboardEntryDto(
                    idx + 1,
                    s.UserId,
                    name,
                    u?.Profile?.AvatarUrl,
                    s.Passed,
                    s.Total,
                    pct);
            })
            .ToList();
    }
}
