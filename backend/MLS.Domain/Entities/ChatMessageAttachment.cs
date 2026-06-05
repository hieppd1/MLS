using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class ChatMessageAttachment : BaseEntity
{
    public Guid MessageId { get; private set; }
    public string FileUrl { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string? MimeType { get; private set; }
    public long SizeBytes { get; private set; }
    public int? Width { get; private set; }
    public int? Height { get; private set; }

    public ChatMessage? Message { get; private set; }

    private ChatMessageAttachment() { }

    public static ChatMessageAttachment Create(
        Guid messageId,
        string fileUrl,
        string fileName,
        string? mimeType,
        long sizeBytes,
        int? width = null,
        int? height = null)
        => new()
        {
            MessageId = messageId,
            FileUrl = fileUrl,
            FileName = fileName,
            MimeType = mimeType,
            SizeBytes = sizeBytes,
            Width = width,
            Height = height,
        };
}
