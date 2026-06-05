using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Type { get; private set; } = string.Empty; // ChatMessage / GroupJoinRequest / GroupApproved / QAReply / System
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string? LinkUrl { get; private set; }
    public bool IsRead { get; private set; }

    public User User { get; private set; } = null!;

    private Notification() { }

    public static Notification Create(Guid userId, string type, string title, string body, string? linkUrl = null)
        => new()
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            LinkUrl = linkUrl,
            IsRead = false,
        };

    public void MarkRead()
    {
        IsRead = true;
        SetUpdatedAt();
    }
}
