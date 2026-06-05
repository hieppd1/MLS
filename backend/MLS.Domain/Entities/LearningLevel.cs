using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class LearningLevel : BaseEntity
{
    public string Name { get; private set; } = default!;
    public string? Description { get; private set; }
    public int OrderIndex { get; private set; }
    public bool IsActive { get; private set; }

    private LearningLevel() { }

    public static LearningLevel Create(string name, string? description, int orderIndex)
    {
        return new LearningLevel
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            OrderIndex = orderIndex,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string name, string? description, int orderIndex)
    {
        Name = name;
        Description = description;
        OrderIndex = orderIndex;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool active)
    {
        IsActive = active;
        UpdatedAt = DateTime.UtcNow;
    }
}
