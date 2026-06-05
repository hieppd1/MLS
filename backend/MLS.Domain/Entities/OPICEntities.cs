using MLS.Domain.Common;

namespace MLS.Domain.Entities;

// ══════════════════════════════════════════════════════════════════════════════
// Phase 3.2 — OPIC Mode Entities
// ══════════════════════════════════════════════════════════════════════════════

/// <summary>Background survey — student chooses topics + target level before exam.</summary>
public class OPICTopicSurvey : BaseEntity
{
    public Guid    UserId            { get; private set; }
    public string  Language          { get; private set; } = "vi";
    public string  SelectedTopics    { get; private set; } = "[]";   // JSONB: ["music","travel",...]
    public string? TargetLevel       { get; private set; }            // "IL" | "IM" | "IH"
    public int     ChosenDifficulty  { get; private set; } = 3;      // 1–6

    private OPICTopicSurvey() { }

    public static OPICTopicSurvey Create(
        Guid userId,
        string[] selectedTopics,
        string? targetLevel = null,
        int chosenDifficulty = 3,
        string language = "vi") => new()
    {
        Id               = Guid.NewGuid(),
        UserId           = userId,
        Language         = language,
        SelectedTopics   = System.Text.Json.JsonSerializer.Serialize(selectedTopics),
        TargetLevel      = targetLevel,
        ChosenDifficulty = chosenDifficulty,
        CreatedAt        = DateTime.UtcNow,
    };

    public void Update(string[] selectedTopics, string? targetLevel, int chosenDifficulty)
    {
        SelectedTopics   = System.Text.Json.JsonSerializer.Serialize(selectedTopics);
        TargetLevel      = targetLevel;
        ChosenDifficulty = chosenDifficulty;
        SetUpdatedAt();
    }
}

/// <summary>Wrapper for a full 15-question OPIC exam session.</summary>
public class OPICSession : BaseEntity
{
    public Guid    UserId            { get; private set; }
    public Guid?   SurveyId         { get; private set; }
    public Guid?   QuizId           { get; private set; }   // FK → Quizzes (null = use newest published)
    public string  Language          { get; private set; } = "vi";
    public string  SessionState      { get; private set; } = "Orientation";
    public int     ChosenDifficulty  { get; private set; } = 3;
    public string? MidAdjustChoice   { get; private set; }   // "easier" | "same" | "harder"
    public int?    FinalDifficulty   { get; private set; }
    public string? OPICLevelResult   { get; private set; }   // "IM2" | "IH" | ...
    public decimal? OverallScore     { get; private set; }
    public bool    IsCompleted       { get; private set; }
    public DateTime StartedAt        { get; private set; }
    public DateTime? CompletedAt     { get; private set; }

    // Navigation
    public OPICTopicSurvey?                Survey       { get; private set; }
    public ICollection<OPICComboGroup>     Combos       { get; private set; } = [];
    public ICollection<OPICAttemptRef>     AttemptRefs  { get; private set; } = [];

    private OPICSession() { }

    public static OPICSession Create(
        Guid userId,
        Guid? surveyId,
        int chosenDifficulty,
        string language = "vi",
        Guid? quizId = null) => new()
    {
        Id               = Guid.NewGuid(),
        UserId           = userId,
        SurveyId         = surveyId,
        QuizId           = quizId,
        Language         = language,
        SessionState     = "Orientation",
        ChosenDifficulty = chosenDifficulty,
        StartedAt        = DateTime.UtcNow,
        CreatedAt        = DateTime.UtcNow,
    };

    public void AdvanceTo(string newState) { SessionState = newState; SetUpdatedAt(); }

    public void SetMidAdjust(string choice)
    {
        MidAdjustChoice = choice;
        FinalDifficulty = choice switch
        {
            "easier" => Math.Max(1, ChosenDifficulty - 1),
            "harder" => Math.Min(6, ChosenDifficulty + 1),
            _        => ChosenDifficulty,
        };
        SetUpdatedAt();
    }

    public void Complete(string levelResult, decimal overallScore)
    {
        OPICLevelResult = levelResult;
        OverallScore    = overallScore;
        IsCompleted     = true;
        SessionState    = "Completed";
        CompletedAt     = DateTime.UtcNow;
        SetUpdatedAt();
    }
}

/// <summary>One combo group within an OPIC session (3 questions on same topic).</summary>
public class OPICComboGroup : BaseEntity
{
    public Guid   SessionId      { get; private set; }
    public int    ComboIndex     { get; private set; }   // 1–5
    public string TopicCategory  { get; private set; } = string.Empty;
    public string TopicType      { get; private set; } = string.Empty;  // "survey_topic"|"common_topic"|"roleplay"|"self_intro"
    public string ComboQuestions { get; private set; } = "[]";  // JSONB: [questionId1,...]

    // Navigation
    public OPICSession? Session { get; private set; }

    private OPICComboGroup() { }

    public static OPICComboGroup Create(
        Guid sessionId,
        int comboIndex,
        string topicCategory,
        string topicType,
        Guid[] questionIds) => new()
    {
        Id             = Guid.NewGuid(),
        SessionId      = sessionId,
        ComboIndex     = comboIndex,
        TopicCategory  = topicCategory,
        TopicType      = topicType,
        ComboQuestions = System.Text.Json.JsonSerializer.Serialize(questionIds),
        CreatedAt      = DateTime.UtcNow,
    };
}

/// <summary>Links a QuizAttempt to a specific question index in an OPIC session.</summary>
public class OPICAttemptRef : BaseEntity
{
    public Guid SessionId      { get; private set; }
    public Guid AttemptId      { get; private set; }
    public int  QuestionIndex  { get; private set; }  // 1–15

    // Navigation
    public OPICSession?  Session { get; private set; }
    public QuizAttempt?  Attempt { get; private set; }

    private OPICAttemptRef() { }

    public static OPICAttemptRef Create(Guid sessionId, Guid attemptId, int questionIndex) => new()
    {
        Id            = Guid.NewGuid(),
        SessionId     = sessionId,
        AttemptId     = attemptId,
        QuestionIndex = questionIndex,
        CreatedAt     = DateTime.UtcNow,
    };
}

/// <summary>Final OPIC level result after AI grading all 15 questions.</summary>
public class OPICLevelResult : BaseEntity
{
    public Guid    UserId                  { get; private set; }
    public Guid    SessionId               { get; private set; }
    public string  Language                { get; private set; } = "vi";
    public string  AssignedLevel           { get; private set; } = "IL";  // NH|IL|IM1|IM2|IM3|IH|AL
    public decimal OverallScore            { get; private set; }
    public decimal PronunciationScore      { get; private set; }
    public decimal FluencyScore            { get; private set; }
    public decimal CoherenceScore          { get; private set; }
    public decimal VocabularyScore         { get; private set; }
    public decimal TaskAchievementScore    { get; private set; }
    public string? LlmLevelJustification   { get; private set; }  // JSONB
    public string? StrongestSkill          { get; private set; }
    public string? WeakestSkill            { get; private set; }
    public string? ImprovementAdvice       { get; private set; }
    public DateTime TestedAt               { get; private set; }

    // Navigation
    public OPICSession? Session { get; private set; }

    private OPICLevelResult() { }

    public static OPICLevelResult Create(
        Guid userId,
        Guid sessionId,
        string assignedLevel,
        decimal overallScore,
        decimal pronunciation,
        decimal fluency,
        decimal coherence,
        decimal vocabulary,
        decimal taskAchievement,
        string? justification,
        string? strongestSkill,
        string? weakestSkill,
        string? improvementAdvice,
        string language = "vi") => new()
    {
        Id                    = Guid.NewGuid(),
        UserId                = userId,
        SessionId             = sessionId,
        Language              = language,
        AssignedLevel         = assignedLevel,
        OverallScore          = overallScore,
        PronunciationScore    = pronunciation,
        FluencyScore          = fluency,
        CoherenceScore        = coherence,
        VocabularyScore       = vocabulary,
        TaskAchievementScore  = taskAchievement,
        LlmLevelJustification = justification,
        StrongestSkill        = strongestSkill,
        WeakestSkill          = weakestSkill,
        ImprovementAdvice     = improvementAdvice,
        TestedAt              = DateTime.UtcNow,
        CreatedAt             = DateTime.UtcNow,
    };
}

/// <summary>Script template for a topic+combo type, authored by teacher.</summary>
public class OPICScriptTemplate : BaseEntity
{
    public Guid    CreatedBy         { get; private set; }
    public string  Language          { get; private set; } = "vi";
    public string  TopicCategory     { get; private set; } = string.Empty;
    public string  ComboType         { get; private set; } = string.Empty;  // "describe"|"routine"|"experience"|"roleplay"
    public string? TargetLevel       { get; private set; }
    public string  OpeningTemplate   { get; private set; } = string.Empty;
    public string  BodyTemplate      { get; private set; } = string.Empty;
    public string  ClosingTemplate   { get; private set; } = string.Empty;
    public string? VocabList         { get; private set; }   // JSONB
    public string? UsefulPhrases     { get; private set; }   // JSONB
    public bool    IsPublished       { get; private set; }

    private OPICScriptTemplate() { }

    public static OPICScriptTemplate Create(
        Guid createdBy,
        string topicCategory,
        string comboType,
        string openingTemplate,
        string bodyTemplate,
        string closingTemplate,
        string? targetLevel = null,
        string language = "vi") => new()
    {
        Id              = Guid.NewGuid(),
        CreatedBy       = createdBy,
        Language        = language,
        TopicCategory   = topicCategory,
        ComboType       = comboType,
        TargetLevel     = targetLevel,
        OpeningTemplate = openingTemplate,
        BodyTemplate    = bodyTemplate,
        ClosingTemplate = closingTemplate,
        IsPublished     = false,
        CreatedAt       = DateTime.UtcNow,
    };

    public void Publish()    { IsPublished = true;  SetUpdatedAt(); }
    public void Unpublish()  { IsPublished = false; SetUpdatedAt(); }
    public void UpdateContent(string opening, string body, string closing,
        string? vocabList, string? usefulPhrases)
    {
        OpeningTemplate = opening;
        BodyTemplate    = body;
        ClosingTemplate = closing;
        VocabList       = vocabList;
        UsefulPhrases   = usefulPhrases;
        SetUpdatedAt();
    }
}
