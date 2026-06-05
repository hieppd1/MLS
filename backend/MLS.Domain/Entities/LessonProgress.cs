using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum LessonProgressStatus { NotStarted, InProgress, Completed }

public class LessonProgress : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid LessonId { get; private set; }
    public LessonProgressStatus Status { get; private set; } = LessonProgressStatus.NotStarted;
    public int? Score { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    public Lesson Lesson { get; private set; } = null!;

    private LessonProgress() { }

    public static LessonProgress Create(Guid userId, Guid lessonId)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            LessonId = lessonId,
            Status = LessonProgressStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
        };

    public void Complete(int? score)
    {
        Status = LessonProgressStatus.Completed;
        Score = score;
        CompletedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
