using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class QuestionOption : BaseEntity
{
    public Guid    QuestionId          { get; private set; }
    public string  Content             { get; private set; } = string.Empty;
    public bool    IsCorrect           { get; private set; }
    public int     DisplayOrder        { get; private set; }
    public string? MatchKey            { get; private set; }   // Matching: left side key e.g. "A"
    public string? MatchValue          { get; private set; }   // Matching: right side e.g. "Dog"
    public string? FeedbackIfSelected  { get; private set; }   // per-option feedback

    // Navigation
    public Question? Question { get; private set; }

    private QuestionOption() { }

    public static QuestionOption Create(
        Guid questionId,
        string content,
        bool isCorrect,
        int displayOrder,
        string? matchKey           = null,
        string? matchValue         = null,
        string? feedbackIfSelected = null) => new()
    {
        Id                 = Guid.NewGuid(),
        QuestionId         = questionId,
        Content            = content.Trim(),
        IsCorrect          = isCorrect,
        DisplayOrder       = displayOrder,
        MatchKey           = matchKey?.Trim(),
        MatchValue         = matchValue?.Trim(),
        FeedbackIfSelected = feedbackIfSelected?.Trim(),
        CreatedAt          = DateTime.UtcNow,
    };

    public void Update(string content, bool isCorrect, int displayOrder,
        string? matchKey = null, string? matchValue = null, string? feedbackIfSelected = null)
    {
        Content            = content.Trim();
        IsCorrect          = isCorrect;
        DisplayOrder       = displayOrder;
        MatchKey           = matchKey?.Trim();
        MatchValue         = matchValue?.Trim();
        FeedbackIfSelected = feedbackIfSelected?.Trim();
        SetUpdatedAt();
    }
}
