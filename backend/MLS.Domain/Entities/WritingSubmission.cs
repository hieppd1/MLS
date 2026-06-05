using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum WritingGradingStatus { Pending, Processing, Done, Failed }

public class WritingSubmission : BaseEntity
{
    public Guid    AttemptAnswerId        { get; private set; }
    public Guid    UserId                 { get; private set; }
    public string  EssayText              { get; private set; } = string.Empty;
    public int     WordCount              { get; private set; }
    public string? TaskType               { get; private set; }  // null="standard" | "letter" | "essay_vstep"
    public string? EssayType              { get; private set; }  // VSTEP T2: "argumentative"|"discussion"|"problem_solution"|"cause_effect"
    public string? GrammarErrors          { get; private set; }  // JSONB: [{message, offset, length, replacements[]}]
    public string? VocabularyAnalysis     { get; private set; }  // JSONB: {cefrLevel, lexicalDiversity, ...}
    public decimal? GrammarScore          { get; private set; }
    public decimal? VocabularyScore       { get; private set; }
    public decimal? CoherenceScore        { get; private set; }
    public decimal? TaskAchievementScore  { get; private set; }
    public decimal? FinalScore            { get; private set; }
    public string?  LlmFeedback           { get; private set; }  // markdown + inline corrections
    public WritingGradingStatus GradingStatus { get; private set; } = WritingGradingStatus.Pending;
    public string?  ExamModeTag           { get; private set; }  // null | "vstep_t1" | "vstep_t2"
    public DateTime? ProcessedAt          { get; private set; }

    // Navigation
    public AttemptAnswer? AttemptAnswer   { get; private set; }

    private WritingSubmission() { }

    public static WritingSubmission Create(
        Guid attemptAnswerId,
        Guid userId,
        string essayText,
        int wordCount,
        string? taskType = null,
        string? essayType = null,
        string? examModeTag = null) => new()
    {
        Id              = Guid.NewGuid(),
        AttemptAnswerId = attemptAnswerId,
        UserId          = userId,
        EssayText       = essayText,
        WordCount       = wordCount,
        TaskType        = taskType,
        EssayType       = essayType,
        GradingStatus   = WritingGradingStatus.Pending,
        ExamModeTag     = examModeTag,
        CreatedAt       = DateTime.UtcNow,
    };

    public void SetProcessing()
    {
        GradingStatus = WritingGradingStatus.Processing;
        SetUpdatedAt();
    }

    public void SetGraded(
        decimal grammarScore,
        decimal vocabularyScore,
        decimal coherenceScore,
        decimal taskAchievementScore,
        decimal finalScore,
        string? llmFeedback,
        string? grammarErrors = null,
        string? vocabularyAnalysis = null)
    {
        GrammarScore          = grammarScore;
        VocabularyScore       = vocabularyScore;
        CoherenceScore        = coherenceScore;
        TaskAchievementScore  = taskAchievementScore;
        FinalScore            = finalScore;
        LlmFeedback           = llmFeedback;
        GrammarErrors         = grammarErrors;
        VocabularyAnalysis    = vocabularyAnalysis;
        GradingStatus         = WritingGradingStatus.Done;
        ProcessedAt           = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void SetFailed()
    {
        GradingStatus = WritingGradingStatus.Failed;
        ProcessedAt   = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
