using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum SupportSenderRole
{
    Student,
    Support,
}

public class SupportMessage : BaseEntity
{
    public Guid ConversationId { get; private set; }
    public Guid SenderId { get; private set; }
    public SupportSenderRole SenderRole { get; private set; }
    public ChatMessageType Type { get; private set; } = ChatMessageType.Text;
    public string? Content { get; private set; }
    public string? FileUrl { get; private set; }
    public string? FileName { get; private set; }
    public string? MimeType { get; private set; }
    public long? SizeBytes { get; private set; }

    public SupportConversation? Conversation { get; private set; }

    private SupportMessage() { }

    public static SupportMessage Create(
        Guid conversationId,
        Guid senderId,
        SupportSenderRole senderRole,
        ChatMessageType type,
        string? content,
        string? fileUrl = null,
        string? fileName = null,
        string? mimeType = null,
        long? sizeBytes = null)
        => new()
        {
            ConversationId = conversationId,
            SenderId = senderId,
            SenderRole = senderRole,
            Type = type,
            Content = content,
            FileUrl = fileUrl,
            FileName = fileName,
            MimeType = mimeType,
            SizeBytes = sizeBytes,
        };
}
