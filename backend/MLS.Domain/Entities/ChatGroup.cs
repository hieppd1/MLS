using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ChatGroupType
{
    Public,
    Private,
}

public class ChatGroup : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? AvatarUrl { get; private set; }
    public ChatGroupType Type { get; private set; } = ChatGroupType.Public;
    public int MaxMembers { get; private set; } = 12;
    public int CurrentMembers { get; private set; }
    public string? Tags { get; private set; }
    public bool IsActive { get; private set; } = true;
    public Guid CreatedBy { get; private set; }

    // Phase 7: Course-linked group
    public Guid? CourseId { get; private set; }
    public bool IsCourseGroup { get; private set; }

    public ICollection<ChatGroupMember> Members { get; private set; } = [];
    public ICollection<ChatMessage> Messages { get; private set; } = [];

    private ChatGroup() { }

    public static ChatGroup Create(
        string name,
        Guid createdBy,
        ChatGroupType type = ChatGroupType.Public,
        string? description = null,
        string? avatarUrl = null,
        int maxMembers = 12,
        string? tags = null)
        => new()
        {
            Name = name.Trim(),
            Description = description?.Trim(),
            AvatarUrl = avatarUrl,
            Type = type,
            MaxMembers = maxMembers,
            CurrentMembers = 0,
            Tags = tags,
            CreatedBy = createdBy,
            IsActive = true,
        };

    /// <summary>Creates an auto-managed private group linked to a course.</summary>
    public static ChatGroup CreateCourseGroup(string courseName, Guid courseId, Guid createdBy, int maxMembers = 500)
        => new()
        {
            Name = $"Nhom KH: {courseName.Trim()}",
            Description = "Nhom chat danh rieng cho hoc vien khoa hoc.",
            Type = ChatGroupType.Private,
            MaxMembers = maxMembers,
            CurrentMembers = 0,
            CreatedBy = createdBy,
            IsActive = true,
            CourseId = courseId,
            IsCourseGroup = true,
        };

    public void Update(string name, string? description, string? avatarUrl, ChatGroupType type, int maxMembers, string? tags)
    {
        Name = name.Trim();
        Description = description?.Trim();
        AvatarUrl = avatarUrl;
        Type = type;
        MaxMembers = maxMembers;
        Tags = tags;
        SetUpdatedAt();
    }

    public void IncrementMembers()
    {
        CurrentMembers += 1;
        SetUpdatedAt();
    }

    public void DecrementMembers()
    {
        if (CurrentMembers > 0) CurrentMembers -= 1;
        SetUpdatedAt();
    }

    public void Deactivate()
    {
        IsActive = false;
        SetUpdatedAt();
    }
}
