using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Quiz.Services;
using MLS.Domain.Entities;
using System.Text.Json;

namespace MLS.Application.Quiz.Commands;

public record SavePlacementResultCommand(Guid UserId, Guid AttemptId) : IRequest<PlacementResultDto>;

public record PlacementResultDto(Guid Id, int Level, Dictionary<string, decimal> SkillBreakdown, string? RecommendedPath);

public class SavePlacementResultHandler(IApplicationDbContext db)
    : IRequestHandler<SavePlacementResultCommand, PlacementResultDto>
{
    public async Task<PlacementResultDto> Handle(SavePlacementResultCommand cmd, CancellationToken ct)
    {
        var attempt = await db.QuizAttempts
            .Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == cmd.AttemptId, ct)
            ?? throw new InvalidOperationException("Attempt not found.");

        if (attempt.UserId != cmd.UserId)
            throw new UnauthorizedAccessException();

        // Y15: Cooldown check — prevent re-testing within 6 months
        var lastResult = await db.PlacementResults
            .Where(r => r.UserId == cmd.UserId)
            .OrderByDescending(r => r.TestedAt)
            .FirstOrDefaultAsync(ct);

        if (lastResult != null && lastResult.TestedAt > DateTime.UtcNow.AddMonths(-6)
            && lastResult.AttemptId != cmd.AttemptId)
        {
            // Return existing result without saving new one
            var bd = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(
                lastResult.SkillBreakdown ?? "{}") ?? [];
            return new PlacementResultDto(lastResult.Id, lastResult.AssignedLevel, bd, lastResult.RecommendedPath);
        }

        // Load questions for this quiz
        var questionIds = attempt.Answers.Select(a => a.QuestionId).ToList();
        var questions = await db.Questions
            .Where(q => questionIds.Contains(q.Id))
            .ToListAsync(ct);

        var (level, breakdown) = PlacementRuleEngine.Determine(attempt.Answers.ToList(), questions);

        var recommendedPath = BuildRecommendedPath(level, breakdown);
        var breakdownJson   = JsonSerializer.Serialize(breakdown);

        // Upsert placement result
        var existing = await db.PlacementResults
            .FirstOrDefaultAsync(pr => pr.UserId == cmd.UserId, ct);

        PlacementResult result;
        if (existing != null)
        {
            // Keep history: always create new
            db.PlacementResults.Remove(existing);
            await db.SaveChangesAsync(ct);
        }

        result = PlacementResult.Create(cmd.UserId, attempt.QuizId, attempt.Id,
            level, breakdownJson, recommendedPath);
        db.PlacementResults.Add(result);
        await db.SaveChangesAsync(ct);

        return new PlacementResultDto(result.Id, level, breakdown, recommendedPath);
    }

    private static string BuildRecommendedPath(int level, Dictionary<string, decimal> breakdown)
    {
        var weakSkills = breakdown
            .Where(kv => kv.Value < 40m)
            .OrderBy(kv => kv.Value)
            .Select(kv => kv.Key)
            .ToList();

        var base_ = $"Level {level} Foundation";
        return weakSkills.Count > 0
            ? $"{base_} — Focus: {string.Join(", ", weakSkills)}"
            : base_;
    }
}
