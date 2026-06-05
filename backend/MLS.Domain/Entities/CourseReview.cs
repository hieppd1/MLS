using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class CourseReview : BaseEntity
{
    public Guid CourseId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }          // 1–5
    public string? Title { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public bool IsVerifiedPurchase { get; private set; }

    // Navigation
    public Course Course { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private CourseReview() { }

    public static CourseReview Create(
        Guid courseId, Guid userId, int rating, string content,
        string? title = null, bool isVerifiedPurchase = false)
        => new()
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            UserId = userId,
            Rating = Math.Clamp(rating, 1, 5),
            Title = title?.Trim(),
            Content = content.Trim(),
            IsVerifiedPurchase = isVerifiedPurchase,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(int rating, string content, string? title = null)
    {
        Rating = Math.Clamp(rating, 1, 5);
        Content = content.Trim();
        Title = title?.Trim();
        SetUpdatedAt();
    }
}
