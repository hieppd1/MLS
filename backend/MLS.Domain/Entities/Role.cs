using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string[] Permissions { get; private set; } = [];

    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();

    private Role() { }

    public static class Names
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string Admin = "Admin";
        public const string ContentManager = "ContentManager";
        public const string Teacher = "Teacher";
        public const string Support = "Support";
        public const string Student = "Student";
    }

    public static Role Create(string name, string? description = null, string[]? permissions = null)
        => new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Permissions = permissions ?? [],
            CreatedAt = DateTime.UtcNow
        };

    public void SetPermissions(string[] permissions) { Permissions = permissions; SetUpdatedAt(); }
    public void Update(string name, string? description) { Name = name.Trim(); Description = description?.Trim(); SetUpdatedAt(); }
}
