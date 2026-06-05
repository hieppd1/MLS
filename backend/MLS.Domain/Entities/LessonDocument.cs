using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum DocumentType { PDF, Audio, Ebook }

public class LessonDocument : BaseEntity
{
    public Guid LessonId { get; private set; }
    public DocumentType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string FileUrl { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public bool IsProtected { get; private set; } = true;
    public int OrderIndex { get; private set; }

    public Lesson Lesson { get; private set; } = null!;

    private LessonDocument() { }

    public static LessonDocument Create(Guid lessonId, DocumentType type, string title, string fileUrl, long sizeBytes, bool isProtected, int orderIndex)
        => new()
        {
            Id = Guid.NewGuid(),
            LessonId = lessonId,
            Type = type,
            Title = title.Trim(),
            FileUrl = fileUrl,
            SizeBytes = sizeBytes,
            IsProtected = isProtected,
            OrderIndex = orderIndex,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string title, bool isProtected, int orderIndex)
    {
        Title = title.Trim();
        IsProtected = isProtected;
        OrderIndex = orderIndex;
        SetUpdatedAt();
    }
}
