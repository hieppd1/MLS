using Microsoft.EntityFrameworkCore;
using MLS.Domain.Entities;
using MLS.Domain.ValueObjects;

namespace MLS.Application.Quiz.Services;

/// <summary>
/// Sprint 8 — Phase 3C: Simplified IRT-style adaptive quiz engine.
/// Standard mode only. OPIC/VSTEP have fixed structure.
/// </summary>
public static class AdaptiveEngine
{
    public const int MaxQuestions   = 20;
    public const int MasteryStreak  = 5;   // 5 consecutive Hard correct → mastery

    private static readonly Dictionary<DifficultyLevel, decimal> DifficultyWeight = new()
    {
        [DifficultyLevel.Easy]   = 1.0m,
        [DifficultyLevel.Medium] = 1.5m,
        [DifficultyLevel.Hard]   = 2.0m,
    };

    // ── Difficulty transitions ─────────────────────────────────────────────────

    /// <summary>
    /// After answering a question, compute the next difficulty level.
    /// 2 consecutive correct → harder; any wrong → easier (floor = Easy).
    /// </summary>
    public static DifficultyLevel CalculateNextDifficulty(
        bool isCorrect, DifficultyLevel current, int currentStreak)
    {
        if (isCorrect)
        {
            var newStreak = currentStreak + 1;
            if (newStreak >= 2 && current < DifficultyLevel.Hard)
                return current + 1;
            return current;
        }

        return current > DifficultyLevel.Easy ? current - 1 : current;
    }

    /// <summary>
    /// Compute the running streak after answering.
    /// </summary>
    public static int CalculateNewStreak(bool isCorrect, int currentStreak)
        => isCorrect ? currentStreak + 1 : 0;

    // ── Stop conditions ────────────────────────────────────────────────────────

    /// <summary>
    /// Returns true when the session should auto-submit.
    /// </summary>
    public static bool ShouldStop(int answeredCount, DifficultyLevel difficulty, int newStreak)
        => answeredCount >= MaxQuestions
           || (newStreak >= MasteryStreak && difficulty == DifficultyLevel.Hard);

    // ── Question selection ─────────────────────────────────────────────────────

    /// <summary>
    /// Selects the next question from the pool for this quiz.
    /// Tries exact difficulty first; falls back to adjacent difficulties.
    /// </summary>
    public static async Task<Question?> SelectNextQuestionAsync(
        IQueryable<QuizQuestion> quizQuestionsQuery,
        ISet<Guid> answeredSet,
        DifficultyLevel difficulty,
        SkillType targetSkill,
        CancellationToken ct)
    {
        // Primary: exact difficulty match
        var question = await quizQuestionsQuery
            .Include(qq => qq.Question)
                .ThenInclude(q => q.Options)
            .Where(qq =>
                !qq.Question.IsDeleted &&
                qq.Question.Difficulty == difficulty &&
                (qq.Question.SkillType == targetSkill || qq.Question.SkillType == SkillType.Mixed) &&
                !answeredSet.Contains(qq.QuestionId))
            .OrderBy(_ => EF.Functions.Random())
            .Select(qq => qq.Question)
            .FirstOrDefaultAsync(ct);

        if (question != null) return question;

        // Fallback: adjacent difficulties (±1)
        var adjacent = new List<DifficultyLevel>();
        if (difficulty > DifficultyLevel.Easy) adjacent.Add(difficulty - 1);
        if (difficulty < DifficultyLevel.Hard) adjacent.Add(difficulty + 1);

        return await quizQuestionsQuery
            .Include(qq => qq.Question)
                .ThenInclude(q => q.Options)
            .Where(qq =>
                !qq.Question.IsDeleted &&
                adjacent.Contains(qq.Question.Difficulty) &&
                !answeredSet.Contains(qq.QuestionId))
            .OrderBy(_ => EF.Functions.Random())
            .Select(qq => qq.Question)
            .FirstOrDefaultAsync(ct);
    }

    // ── Scoring ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Computes the adaptive final score.
    /// rawScore = Σ(correct × difficultyWeight)
    /// finalScore = (rawScore / maxPossible) × quiz.TotalScore
    /// </summary>
    public static decimal CalculateAdaptiveScore(
        IEnumerable<AdaptiveAnswerEntry> answers, decimal totalScore)
    {
        decimal rawScore = answers
            .Where(a => a.IsCorrect)
            .Sum(a => Enum.TryParse<DifficultyLevel>(a.Difficulty, out var d)
                      ? DifficultyWeight.GetValueOrDefault(d, 1.0m)
                      : 1.0m);

        const decimal maxPossible = MaxQuestions * 2.0m; // all Hard correct
        return maxPossible > 0
            ? Math.Round(rawScore / maxPossible * totalScore, 2)
            : 0m;
    }

    // ── State helpers ──────────────────────────────────────────────────────────

    /// <summary>
    /// Build the initial adaptive state for a new session.
    /// </summary>
    public static AdaptiveStateSnapshot InitialState() => new()
    {
        Difficulty = "Medium",
        Streak     = 0,
        Answered   = 0,
        Answers    = [],
    };
}
