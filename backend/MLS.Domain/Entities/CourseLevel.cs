using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class CourseLevel : BaseEntity
{
    public Guid CourseId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int OrderIndex { get; private set; }
    public bool IsPublished { get; private set; }

    public Course Course { get; private set; } = null!;
    public ICollection<CourseModule> Modules { get; private set; } = [];

    private CourseLevel() { }

    public static CourseLevel Create(Guid courseId, string name, string? description, int orderIndex)
        => new()
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            Name = name.Trim(),
            Description = description?.Trim(),
            OrderIndex = orderIndex,
            IsPublished = false,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string name, string? description, int orderIndex)
    {
        Name = name.Trim();
        Description = description?.Trim();
        OrderIndex = orderIndex;
        SetUpdatedAt();
    }

    public void Publish() { IsPublished = true; SetUpdatedAt(); }
    public void Unpublish() { IsPublished = false; SetUpdatedAt(); }
}
