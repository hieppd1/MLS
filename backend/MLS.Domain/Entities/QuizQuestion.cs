using MLS.Domain.Common;

namespace MLS.Domain.Entities;

/// <summary>Join table linking a Quiz to its Questions with per-quiz score override.</summary>
public class QuizQuestion : BaseEntity
{
    public Guid    QuizId       { get; private set; }
    public Guid    QuestionId   { get; private set; }
    public int     DisplayOrder { get; private set; }
    public decimal Score        { get; private set; } = 1m;  // overrides Question.DefaultScore

    // Navigation
    public Quiz?     Quiz     { get; private set; }
    public Question? Question { get; private set; }

    private QuizQuestion() { }

    public static QuizQuestion Create(Guid quizId, Guid questionId, int displayOrder, decimal score) => new()
    {
        Id           = Guid.NewGuid(),
        QuizId       = quizId,
        QuestionId   = questionId,
        DisplayOrder = displayOrder,
        Score        = score,
        CreatedAt    = DateTime.UtcNow,
    };

    public void Reorder(int displayOrder)
    {
        DisplayOrder = displayOrder;
        SetUpdatedAt();
    }

    public void OverrideScore(decimal score)
    {
        Score = score;
        SetUpdatedAt();
    }
}
