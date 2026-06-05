using MLS.Domain.Common;

namespace MLS.Domain.Entities;

// ══════════════════════════════════════════════════════════════════════════════
// Phase 3.3 — VSTEP Mode Entities
// ══════════════════════════════════════════════════════════════════════════════

/// <summary>
/// PassageGroup links a reading passage or listening audio clip to its questions.
/// Used by both VSTEP Listening (audioUrl) and VSTEP Reading (passageText).
/// </summary>
public class PassageGroup : BaseEntity
{
    public Guid    QuizId           { get; private set; }
    public int     GroupIndex       { get; private set; }
    public string  PassageType      { get; private set; } = "reading"; // "reading" | "listening_short" | "listening_dialogue" | "listening_lecture"
    public string? PassageText      { get; private set; }   // Reading text
    public string? AudioUrl         { get; private set; }   // Listening audio
    public int     AudioPlayLimit   { get; private set; } = 2;
    public int     PreListenSeconds { get; private set; } = 20;
    public string  QuestionIds      { get; private set; } = "[]"; // JSONB: [questionId1, ...]
    public int     DisplayOrder     { get; private set; }

    // Navigation
    public Quiz? Quiz { get; private set; }

    private PassageGroup() { }

    public static PassageGroup Create(
        Guid quizId,
        int groupIndex,
        string passageType,
        string? passageText,
        string? audioUrl,
        Guid[] questionIds,
        int displayOrder = 0,
        int audioPlayLimit = 2,
        int preListenSeconds = 20) => new()
    {
        Id              = Guid.NewGuid(),
        QuizId          = quizId,
        GroupIndex      = groupIndex,
        PassageType     = passageType,
        PassageText     = passageText,
        AudioUrl        = audioUrl,
        QuestionIds     = System.Text.Json.JsonSerializer.Serialize(questionIds),
        DisplayOrder    = displayOrder,
        AudioPlayLimit  = audioPlayLimit,
        PreListenSeconds = preListenSeconds,
        CreatedAt       = DateTime.UtcNow,
    };

    public void Update(string? passageText, string? audioUrl, Guid[] questionIds, string? passageType = null)
    {
        if (passageText is not null) PassageText = passageText;
        if (audioUrl is not null) AudioUrl = audioUrl;
        if (passageType is not null) PassageType = passageType;
        QuestionIds = System.Text.Json.JsonSerializer.Serialize(questionIds);
        SetUpdatedAt();
    }
}

/// <summary>
/// Wrapper for a full 4-part VSTEP exam session
/// (Listening → Reading → Writing → Speaking).
/// </summary>
public class VSTEPSession : BaseEntity
{
    public Guid    UserId              { get; private set; }
    public string? TargetBand          { get; private set; }   // "B1" | "B2" | "C1"
    public string  CurrentPart         { get; private set; } = "Listening"; // Listening | Reading | Writing | Speaking | Completed
    public string? PartState           { get; private set; }   // JSONB: {listening:"Graded", reading:"InProgress", ...}

    // Scores per part (0–10)
    public decimal? ListeningScore     { get; private set; }
    public decimal? ReadingScore       { get; private set; }
    public decimal? WritingScore       { get; private set; }
    public decimal? SpeakingScore      { get; private set; }
    public decimal? OverallScore       { get; private set; }

    // Band result
    public string? AssignedBand        { get; private set; }   // "A2" | "B1" | "B2" | "C1"
    public int?    AssignedLevel       { get; private set; }   // 2–5 (Khung 6 bậc)

    // FK to 4 attempts
    public Guid?   ListeningAttemptId  { get; private set; }
    public Guid?   ReadingAttemptId    { get; private set; }
    public Guid?   WritingAttemptId    { get; private set; }
    public Guid?   SpeakingAttemptId   { get; private set; }

    public bool    IsCompleted         { get; private set; }
    public DateTime StartedAt          { get; private set; }
    public DateTime? CompletedAt       { get; private set; }

    private VSTEPSession() { }

    public static VSTEPSession Create(Guid userId, string? targetBand = null) => new()
    {
        Id          = Guid.NewGuid(),
        UserId      = userId,
        TargetBand  = targetBand,
        CurrentPart = "Listening",
        StartedAt   = DateTime.UtcNow,
        CreatedAt   = DateTime.UtcNow,
    };

    public void StartPart(string part, Guid attemptId)
    {
        CurrentPart = part;
        switch (part)
        {
            case "Listening": ListeningAttemptId = attemptId; break;
            case "Reading":   ReadingAttemptId   = attemptId; break;
            case "Writing":   WritingAttemptId   = attemptId; break;
            case "Speaking":  SpeakingAttemptId  = attemptId; break;
        }
        UpdatePartState(part, "InProgress");
        SetUpdatedAt();
    }

    public void SetPartScore(string part, decimal score)
    {
        switch (part)
        {
            case "Listening": ListeningScore = score; break;
            case "Reading":   ReadingScore   = score; break;
            case "Writing":   WritingScore   = score; break;
            case "Speaking":  SpeakingScore  = score; break;
        }
        UpdatePartState(part, "Graded");
        RecalculateOverall();
        SetUpdatedAt();
    }

    public void Complete(string assignedBand, int assignedLevel, decimal overallScore)
    {
        AssignedBand  = assignedBand;
        AssignedLevel = assignedLevel;
        OverallScore  = overallScore;
        IsCompleted   = true;
        CompletedAt   = DateTime.UtcNow;
        CurrentPart   = "Completed";
        SetUpdatedAt();
    }

    private void RecalculateOverall()
    {
        var scores = new[] { ListeningScore, ReadingScore, WritingScore, SpeakingScore }
            .Where(s => s.HasValue).Select(s => s!.Value).ToArray();
        if (scores.Length > 0)
            OverallScore = Math.Round(scores.Average(), 2);
    }

    private void UpdatePartState(string part, string state)
    {
        var dict = ParsePartState();
        dict[part.ToLower()] = state;
        PartState = System.Text.Json.JsonSerializer.Serialize(dict);
    }

    public Dictionary<string, string> ParsePartState()
    {
        if (string.IsNullOrEmpty(PartState)) return [];
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(PartState) ?? [];
        }
        catch { return []; }
    }
}

/// <summary>
/// Final VSTEP band result after all 4 parts are graded.
/// </summary>
public class VSTEPBandResult : BaseEntity
{
    public Guid    UserId           { get; private set; }
    public Guid    SessionId        { get; private set; }
    public string  AssignedBand     { get; private set; } = "B1";  // "A2" | "B1" | "B2" | "C1"
    public int     AssignedLevel    { get; private set; } = 3;     // 2–5
    public decimal ListeningScore   { get; private set; }
    public decimal ReadingScore     { get; private set; }
    public decimal WritingScore     { get; private set; }
    public decimal SpeakingScore    { get; private set; }
    public decimal OverallScore     { get; private set; }
    public string? SkillBreakdown   { get; private set; }          // JSONB
    public string? RecommendedCourses { get; private set; }        // JSONB
    public DateTime TestedAt        { get; private set; }

    // Navigation
    public VSTEPSession? Session { get; private set; }

    private VSTEPBandResult() { }

    public static VSTEPBandResult Create(
        Guid userId,
        Guid sessionId,
        string assignedBand,
        int assignedLevel,
        decimal listeningScore,
        decimal readingScore,
        decimal writingScore,
        decimal speakingScore) => new()
    {
        Id             = Guid.NewGuid(),
        UserId         = userId,
        SessionId      = sessionId,
        AssignedBand   = assignedBand,
        AssignedLevel  = assignedLevel,
        ListeningScore = listeningScore,
        ReadingScore   = readingScore,
        WritingScore   = writingScore,
        SpeakingScore  = speakingScore,
        OverallScore   = Math.Round((listeningScore + readingScore + writingScore + speakingScore) / 4, 2),
        TestedAt       = DateTime.UtcNow,
        CreatedAt      = DateTime.UtcNow,
    };
}
