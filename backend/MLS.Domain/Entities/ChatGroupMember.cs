using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ChatGroupMemberRole
{
    Owner,
    Moderator,
    Member,
}

public enum ChatGroupMemberStatus
{
    Pending,
    Approved,
    Rejected,
}

public class ChatGroupMember : BaseEntity
{
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public ChatGroupMemberRole Role { get; private set; } = ChatGroupMemberRole.Member;
    public ChatGroupMemberStatus Status { get; private set; } = ChatGroupMemberStatus.Pending;
    public DateTime? JoinedAt { get; private set; }
    public Guid? ApprovedBy { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public Guid? LastReadMessageId { get; private set; }

    public ChatGroup? Group { get; private set; }

    private ChatGroupMember() { }

    public static ChatGroupMember Create(Guid groupId, Guid userId, ChatGroupMemberRole role, ChatGroupMemberStatus status)
    {
        var now = DateTime.UtcNow;
        return new ChatGroupMember
        {
            GroupId = groupId,
            UserId = userId,
            Role = role,
            Status = status,
            JoinedAt = status == ChatGroupMemberStatus.Approved ? now : null,
        };
    }

    public void Approve(Guid approverId)
    {
        Status = ChatGroupMemberStatus.Approved;
        ApprovedBy = approverId;
        ApprovedAt = DateTime.UtcNow;
        JoinedAt ??= DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void Reject(Guid approverId)
    {
        Status = ChatGroupMemberStatus.Rejected;
        ApprovedBy = approverId;
        ApprovedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void Promote(ChatGroupMemberRole role)
    {
        Role = role;
        SetUpdatedAt();
    }

    public void MarkRead(Guid messageId)
    {
        LastReadMessageId = messageId;
        SetUpdatedAt();
    }
}
