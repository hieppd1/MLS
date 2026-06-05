using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class BookReview : BaseEntity
{
    public Guid BookId  { get; private set; }
    public Guid UserId  { get; private set; }
    public int  Rating  { get; private set; }   // 1–5
    public string? Title   { get; private set; }
    public string  Content { get; private set; } = string.Empty;
    public bool IsVerifiedPurchase { get; private set; }

    // Navigation
    public Book Book { get; private set; } = null!;
    public User User { get; private set; } = null!;

    private BookReview() { }

    public static BookReview Create(
        Guid bookId, Guid userId, int rating, string content,
        string? title = null, bool isVerifiedPurchase = false)
        => new()
        {
            Id        = Guid.NewGuid(),
            BookId    = bookId,
            UserId    = userId,
            Rating    = Math.Clamp(rating, 1, 5),
            Title     = title?.Trim(),
            Content   = content.Trim(),
            IsVerifiedPurchase = isVerifiedPurchase,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(int rating, string content, string? title = null)
    {
        Rating  = Math.Clamp(rating, 1, 5);
        Content = content.Trim();
        Title   = title?.Trim();
        SetUpdatedAt();
    }
}
