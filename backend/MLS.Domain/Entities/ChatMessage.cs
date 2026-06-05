using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ChatMessageType
{
    Text,
    Image,
    File,
    System,
}

public class ChatMessage : BaseEntity
{
    public Guid GroupId { get; private set; }
    public Guid SenderId { get; private set; }
    public ChatMessageType Type { get; private set; } = ChatMessageType.Text;
    public string? Content { get; private set; }
    public Guid? ReplyToId { get; private set; }
    public bool IsDeleted { get; private set; }

    public ChatGroup? Group { get; private set; }
    public ChatMessage? ReplyTo { get; private set; }
    public ICollection<ChatMessageAttachment> Attachments { get; private set; } = [];

    private ChatMessage() { }

    public static ChatMessage Create(Guid groupId, Guid senderId, ChatMessageType type, string? content, Guid? replyToId = null)
        => new()
        {
            GroupId = groupId,
            SenderId = senderId,
            Type = type,
            Content = content,
            ReplyToId = replyToId,
        };

    public void SoftDelete()
    {
        IsDeleted = true;
        Content = null;
        SetUpdatedAt();
    }
}
