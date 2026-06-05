using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class CourseModule : BaseEntity
{
    public Guid CourseId { get; private set; }
    public Guid? LevelId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }   // HTML
    public string? ThumbnailUrl { get; private set; }
    public int EstimatedDuration { get; private set; } // minutes
    public int OrderIndex { get; private set; }
    public bool IsLocked { get; private set; }

    public Course Course { get; private set; } = null!;
    public CourseLevel? Level { get; private set; }
    public ICollection<Session> Sessions { get; private set; } = [];

    private CourseModule() { }

    public static CourseModule Create(Guid courseId, string title, string? description, int orderIndex, Guid? levelId = null)
        => new()
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            LevelId = levelId,
            Title = title.Trim(),
            Description = description?.Trim(),
            OrderIndex = orderIndex,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string title, string? description, int orderIndex, bool isLocked = false,
        Guid? levelId = null, string? thumbnailUrl = null, int estimatedDuration = 0)
    {
        Title = title.Trim();
        Description = description?.Trim();
        ThumbnailUrl = thumbnailUrl?.Trim();
        EstimatedDuration = estimatedDuration;
        OrderIndex = orderIndex;
        IsLocked = isLocked;
        LevelId = levelId;
        SetUpdatedAt();
    }

}
