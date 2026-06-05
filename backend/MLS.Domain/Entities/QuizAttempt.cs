using System.Text.Json;
using MLS.Domain.Common;
using MLS.Domain.ValueObjects;

namespace MLS.Domain.Entities;

public enum AttemptState   { InProgress, Submitted, Grading, Graded, Abandoned }
public enum GradingMethod  { Auto, AI, Manual }

public class QuizAttempt : BaseEntity
{
    public Guid          QuizId         { get; private set; }
    public Guid          UserId         { get; private set; }
    public AttemptState  State          { get; private set; } = AttemptState.InProgress;
    public GradingMethod GradingMethod  { get; private set; } = GradingMethod.Auto;
    public DateTime      StartedAt      { get; private set; }
    public DateTime?     SubmittedAt    { get; private set; }
    public DateTime?     GradedAt       { get; private set; }
    public decimal?      Score          { get; private set; }
    public decimal?      AiScore        { get; private set; }
    public decimal?      Percentage     { get; private set; }
    public bool          Passed         { get; private set; }
    public int           AttemptNumber  { get; private set; } = 1;
    public int?          TimeTaken      { get; private set; }  // seconds
    public DateTime?     ExpiresAt      { get; private set; }  // set when quiz has Duration
    public string?       AntiCheatLog   { get; private set; }  // JSONB [{event, timestamp}]
    public string?       ExamMeta       { get; private set; }  // JSONB — mode-specific metadata (OPIC/VSTEP)

    // Navigation
    public Quiz?                       Quiz    { get; private set; }
    public ICollection<AttemptAnswer>  Answers { get; private set; } = [];

    private QuizAttempt() { }

    public static QuizAttempt Create(Guid quizId, Guid userId, int attemptNumber,
        GradingMethod gradingMethod = GradingMethod.Auto,
        int? durationSeconds = null) => new()
    {
        Id            = Guid.NewGuid(),
        QuizId        = quizId,
        UserId        = userId,
        AttemptNumber = attemptNumber,
        State         = AttemptState.InProgress,
        GradingMethod = gradingMethod,
        StartedAt     = DateTime.UtcNow,
        ExpiresAt     = durationSeconds.HasValue
                          ? DateTime.UtcNow.AddSeconds(durationSeconds.Value)
                          : null,
        CreatedAt     = DateTime.UtcNow,
    };

    public void Submit(int timeTaken)
    {
        State       = AttemptState.Submitted;
        TimeTaken   = timeTaken;
        SubmittedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void Grade(decimal score, decimal totalScore, decimal passingScore)
    {
        Score      = score;
        Percentage = totalScore > 0 ? Math.Round(score / totalScore * 100, 2) : 0;
        Passed     = score >= passingScore;
        State      = AttemptState.Graded;
        GradedAt   = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void SetGrading()
    {
        State = AttemptState.Grading;
        SetUpdatedAt();
    }

    public void Abandon()
    {
        State = AttemptState.Abandoned;
        SetUpdatedAt();
    }

    public void AppendAntiCheatEvent(string eventJson)
    {
        // Simple append — in production store as JSONB array
        AntiCheatLog = string.IsNullOrEmpty(AntiCheatLog)
            ? $"[{eventJson}]"
            : AntiCheatLog[..^1] + $",{eventJson}]";
        SetUpdatedAt();
    }

    // ── Adaptive quiz state (Sprint 8) ────────────────────────────────────────
    // Stored in AntiCheatLog as: { "adaptiveState": { ... } }

    public void SetAdaptiveState(AdaptiveStateSnapshot state)
    {
        AntiCheatLog = JsonSerializer.Serialize(new { adaptiveState = state });
        SetUpdatedAt();
    }

    public AdaptiveStateSnapshot? GetAdaptiveState()
    {
        if (string.IsNullOrEmpty(AntiCheatLog)) return null;
        var trimmed = AntiCheatLog.TrimStart();
        if (!trimmed.StartsWith('{')) return null;
        try
        {
            using var doc = JsonDocument.Parse(AntiCheatLog);
            if (!doc.RootElement.TryGetProperty("adaptiveState", out var el)) return null;
            return JsonSerializer.Deserialize<AdaptiveStateSnapshot>(el.GetRawText(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch { return null; }
    }
}
