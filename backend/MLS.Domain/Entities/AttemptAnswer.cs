using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class AttemptAnswer : BaseEntity
{
    public Guid    AttemptId   { get; private set; }
    public Guid    QuestionId  { get; private set; }
    /// <summary>JSONB: ["optionId"] | "true" | "text answer" | [[matchKey, matchVal],...]</summary>
    public string? AnswerValue { get; private set; }
    public string? AudioUrl    { get; private set; }   // Speaking: uploaded audio file
    public string? EssayText   { get; private set; }   // Writing: essay content
    public bool?   IsCorrect   { get; private set; }
    public decimal? Score      { get; private set; }
    public decimal? AiScore    { get; private set; }
    public string?  AiFeedback { get; private set; }   // JSONB: {grammar:[], vocab:[], score:8}
    public bool     IsSkipped  { get; private set; }

    // Navigation
    public QuizAttempt? Attempt  { get; private set; }
    public Question?    Question { get; private set; }

    private AttemptAnswer() { }

    public static AttemptAnswer Create(Guid attemptId, Guid questionId,
        string? answerValue = null, string? audioUrl = null, string? essayText = null,
        bool isSkipped = false) => new()
    {
        Id          = Guid.NewGuid(),
        AttemptId   = attemptId,
        QuestionId  = questionId,
        AnswerValue = answerValue,
        AudioUrl    = audioUrl?.Trim(),
        EssayText   = essayText,
        IsSkipped   = isSkipped,
        CreatedAt   = DateTime.UtcNow,
    };

    public void SetGradeResult(bool isCorrect, decimal score)
    {
        IsCorrect = isCorrect;
        Score     = score;
        SetUpdatedAt();
    }

    public void SetAiGradeResult(decimal aiScore, string? aiFeedback)
    {
        AiScore    = aiScore;
        AiFeedback = aiFeedback;
        SetUpdatedAt();
    }

    public void UpdateAnswer(string? answerValue, string? audioUrl = null, string? essayText = null)
    {
        AnswerValue = answerValue;
        AudioUrl    = audioUrl?.Trim() ?? AudioUrl;
        EssayText   = essayText ?? EssayText;
        IsSkipped   = answerValue is null && audioUrl is null && essayText is null;
        SetUpdatedAt();
    }
}
