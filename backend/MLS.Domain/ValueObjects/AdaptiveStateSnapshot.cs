namespace MLS.Domain.ValueObjects;

/// <summary>
/// Adaptive quiz session state persisted inside QuizAttempt.AntiCheatLog.
/// Format stored: { "adaptiveState": { ... } }
/// </summary>
public class AdaptiveStateSnapshot
{
    public string Difficulty { get; set; } = "Medium";   // Easy | Medium | Hard
    public int    Streak     { get; set; } = 0;
    public int    Answered   { get; set; } = 0;
    public List<AdaptiveAnswerEntry> Answers { get; set; } = [];
}

public class AdaptiveAnswerEntry
{
    public Guid   QuestionId { get; set; }
    public bool   IsCorrect  { get; set; }
    public string Difficulty { get; set; } = "Medium";
}
