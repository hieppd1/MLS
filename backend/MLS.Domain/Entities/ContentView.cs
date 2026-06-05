using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ContentViewType
{
    Course,
    Teacher,
    Book,
}

/// <summary>Lightweight view event — recorded once per session (user+content+day).</summary>
public class ContentView : BaseEntity
{
    public ContentViewType ContentType { get; private set; }
    public Guid ContentId { get; private set; }
    public Guid? UserId { get; private set; }
    public DateTime ViewedAt { get; private set; }

    private ContentView() { }

    public static ContentView Record(ContentViewType type, Guid contentId, Guid? userId)
        => new()
        {
            ContentType = type,
            ContentId = contentId,
            UserId = userId,
            ViewedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
}
