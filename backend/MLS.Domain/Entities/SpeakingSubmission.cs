using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum SpeakingGradingStatus { Pending, Processing, Done, Failed }

public class SpeakingSubmission : BaseEntity
{
    public Guid    AttemptAnswerId       { get; private set; }
    public Guid    UserId                { get; private set; }
    public string  AudioUrl              { get; private set; } = string.Empty;
    public string? TranscriptText        { get; private set; }
    public string? TranscriptUrl         { get; private set; }
    public decimal? PronunciationScore   { get; private set; }
    public decimal? FluencyScore         { get; private set; }
    public decimal? AccuracyScore        { get; private set; }
    // Extra fields for OPIC / VSTEP reuse (nullable — only set when mode != Standard)
    public decimal? CoherenceScore       { get; private set; }
    public decimal? VocabularyScore      { get; private set; }
    public decimal? TaskAchievementScore { get; private set; }
    public decimal? FinalScore           { get; private set; }
    public string?  PhonemeAnalysis      { get; private set; }  // JSONB
    public string?  LlmFeedback          { get; private set; }  // markdown
    public SpeakingGradingStatus GradingStatus { get; private set; } = SpeakingGradingStatus.Pending;
    public string?  ExamModeTag          { get; private set; }  // null | "opic_describe" | "vstep_p2"
    public DateTime? ProcessedAt         { get; private set; }

    // Navigation
    public AttemptAnswer? AttemptAnswer  { get; private set; }

    private SpeakingSubmission() { }

    public static SpeakingSubmission Create(
        Guid attemptAnswerId,
        Guid userId,
        string audioUrl,
        string? examModeTag = null) => new()
    {
        Id              = Guid.NewGuid(),
        AttemptAnswerId = attemptAnswerId,
        UserId          = userId,
        AudioUrl        = audioUrl,
        GradingStatus   = SpeakingGradingStatus.Pending,
        ExamModeTag     = examModeTag,
        CreatedAt       = DateTime.UtcNow,
    };

    public void SetProcessing()
    {
        GradingStatus = SpeakingGradingStatus.Processing;
        SetUpdatedAt();
    }

    public void SetGraded(
        string? transcriptText,
        decimal pronunciationScore,
        decimal fluencyScore,
        decimal accuracyScore,
        decimal finalScore,
        string? llmFeedback,
        string? phonemeAnalysis = null,
        decimal? coherenceScore = null,
        decimal? vocabularyScore = null,
        decimal? taskAchievementScore = null)
    {
        TranscriptText       = transcriptText;
        PronunciationScore   = pronunciationScore;
        FluencyScore         = fluencyScore;
        AccuracyScore        = accuracyScore;
        CoherenceScore       = coherenceScore;
        VocabularyScore      = vocabularyScore;
        TaskAchievementScore = taskAchievementScore;
        FinalScore           = finalScore;
        LlmFeedback          = llmFeedback;
        PhonemeAnalysis      = phonemeAnalysis;
        GradingStatus        = SpeakingGradingStatus.Done;
        ProcessedAt          = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void SetFailed()
    {
        GradingStatus = SpeakingGradingStatus.Failed;
        ProcessedAt   = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
