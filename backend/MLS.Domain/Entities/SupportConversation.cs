using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum SupportConversationStatus
{
    Open,
    Closed,
}

public class SupportConversation : BaseEntity
{
    public Guid StudentId { get; private set; }
    public Guid? SupportUserId { get; private set; }
    public SupportConversationStatus Status { get; private set; } = SupportConversationStatus.Open;
    public DateTime? LastMessageAt { get; private set; }

    public ICollection<SupportMessage> Messages { get; private set; } = [];

    private SupportConversation() { }

    public static SupportConversation Create(Guid studentId)
        => new()
        {
            StudentId = studentId,
            Status = SupportConversationStatus.Open,
        };

    public void Assign(Guid supportUserId)
    {
        SupportUserId = supportUserId;
        SetUpdatedAt();
    }

    public void Close()
    {
        Status = SupportConversationStatus.Closed;
        SetUpdatedAt();
    }

    public void TouchLastMessage(DateTime at)
    {
        LastMessageAt = at;
        SetUpdatedAt();
    }
}
