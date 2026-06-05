using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class PlacementResult : BaseEntity
{
    public Guid    UserId            { get; private set; }
    public Guid    QuizId            { get; private set; }
    public Guid    AttemptId         { get; private set; }
    public int     AssignedLevel     { get; private set; }    // 1–6
    /// <summary>JSONB: {listening:80, grammar:60, reading:75, writing:70, vocabulary:85}</summary>
    public string? SkillBreakdown    { get; private set; }
    /// <summary>JSONB: [courseId1, courseId2, ...]</summary>
    public string? RecommendedPath   { get; private set; }
    public DateTime TestedAt         { get; private set; }

    // Navigation
    public Quiz?         Quiz    { get; private set; }
    public QuizAttempt?  Attempt { get; private set; }

    private PlacementResult() { }

    public static PlacementResult Create(
        Guid userId,
        Guid quizId,
        Guid attemptId,
        int assignedLevel,
        string? skillBreakdown  = null,
        string? recommendedPath = null) => new()
    {
        Id               = Guid.NewGuid(),
        UserId           = userId,
        QuizId           = quizId,
        AttemptId        = attemptId,
        AssignedLevel    = assignedLevel,
        SkillBreakdown   = skillBreakdown,
        RecommendedPath  = recommendedPath,
        TestedAt         = DateTime.UtcNow,
        CreatedAt        = DateTime.UtcNow,
    };
}
