using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum BookType { Ebook, Physical, Combo }
public enum BookStatus { Draft, Published, Hidden, Archived }

public class Book : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? ShortDescription { get; private set; }
    public string? Author { get; private set; }
    public string? Publisher { get; private set; }
    public string? Isbn { get; private set; }

    // Cover art (used when no real CoverUrl image is available)
    public string CoverColor { get; private set; } = "#1a3a5c";
    public string CoverEmoji { get; private set; } = "📚";
    public string? CoverUrl { get; private set; }

    public BookType Type { get; private set; } = BookType.Ebook;
    public Guid? CategoryId { get; private set; }
    public string? Level { get; private set; } // A1, A2, B1, B2, C1, C2
    public string? Tags { get; private set; } // JSON array

    public decimal Price { get; private set; }
    public decimal? DiscountPrice { get; private set; }
    public DateTime? DiscountEndsAt { get; private set; }

    public int? PageCount { get; private set; }
    public string? FileUrl { get; private set; }      // S3 URL for ebook PDF
    public decimal? FileSizeMb { get; private set; }
    public string? SampleUrl { get; private set; }    // Free preview URL

    public BookStatus Status { get; private set; } = BookStatus.Draft;
    public bool IsFeatured { get; private set; }
    public int SortOrder { get; private set; }
    public decimal Rating { get; private set; }
    public int ReviewCount { get; private set; }
    public int PurchaseCount { get; private set; }
    public Guid CreatedBy { get; private set; }

    public BookCategory? Category { get; private set; }
    public ICollection<EbookEntitlement> Entitlements { get; private set; } = [];

    private Book() { }

    public static Book Create(
        string title,
        BookType type,
        decimal price,
        Guid createdBy,
        string? description = null,
        string? shortDescription = null,
        string? author = null,
        string? publisher = null,
        string? isbn = null,
        string coverColor = "#1a3a5c",
        string coverEmoji = "📚",
        string? coverUrl = null,
        Guid? categoryId = null,
        string? level = null,
        string? tags = null,
        decimal? discountPrice = null,
        DateTime? discountEndsAt = null,
        int? pageCount = null,
        string? fileUrl = null,
        decimal? fileSizeMb = null,
        string? sampleUrl = null,
        bool isFeatured = false,
        int sortOrder = 0)
        => new()
        {
            Title = title.Trim(),
            Slug = GenerateSlug(title),
            Description = description?.Trim(),
            ShortDescription = shortDescription?.Trim(),
            Author = author?.Trim(),
            Publisher = publisher?.Trim(),
            Isbn = isbn?.Trim(),
            CoverColor = coverColor,
            CoverEmoji = coverEmoji,
            CoverUrl = coverUrl?.Trim(),
            Type = type,
            CategoryId = categoryId,
            Level = level,
            Tags = tags,
            Price = price,
            DiscountPrice = discountPrice,
            DiscountEndsAt = discountEndsAt,
            PageCount = pageCount,
            FileUrl = fileUrl?.Trim(),
            FileSizeMb = fileSizeMb,
            SampleUrl = sampleUrl?.Trim(),
            Status = BookStatus.Draft,
            IsFeatured = isFeatured,
            SortOrder = sortOrder,
            Rating = 0,
            ReviewCount = 0,
            PurchaseCount = 0,
            CreatedBy = createdBy,
        };

    private static string GenerateSlug(string title)
    {
        var slug = title.Trim().ToLower()
            .Replace(" ", "-")
            .Replace("đ", "d");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        var shortId = Guid.NewGuid().ToString("N")[..6];
        return slug.Length > 0 ? $"{slug}-{shortId}" : Guid.NewGuid().ToString("N")[..12];
    }

    public void Publish()
    {
        Status = BookStatus.Published;
        SetUpdatedAt();
    }

    public void Hide()
    {
        Status = BookStatus.Hidden;
        SetUpdatedAt();
    }

    public void Archive()
    {
        Status = BookStatus.Archived;
        SetUpdatedAt();
    }

    public void Update(
        string title, string? description, string? shortDescription, string? author,
        string? publisher, string? isbn, BookType type, Guid? categoryId,
        string? level, string? tags, decimal price, decimal? discountPrice,
        DateTime? discountEndsAt, int? pageCount, string? fileUrl, decimal? fileSizeMb,
        string? sampleUrl, string coverColor, string coverEmoji, string? coverUrl,
        bool isFeatured, int sortOrder)
    {
        Title = title.Trim();
        Description = description?.Trim();
        ShortDescription = shortDescription?.Trim();
        Author = author?.Trim();
        Publisher = publisher?.Trim();
        Isbn = isbn?.Trim();
        Type = type;
        CategoryId = categoryId;
        Level = level;
        Tags = tags;
        Price = price;
        DiscountPrice = discountPrice;
        DiscountEndsAt = discountEndsAt;
        PageCount = pageCount;
        FileUrl = fileUrl?.Trim();
        FileSizeMb = fileSizeMb;
        SampleUrl = sampleUrl?.Trim();
        CoverColor = coverColor;
        CoverEmoji = coverEmoji;
        CoverUrl = coverUrl?.Trim();
        IsFeatured = isFeatured;
        SortOrder = sortOrder;
        SetUpdatedAt();
    }

    public void IncrementPurchaseCount() { PurchaseCount++; SetUpdatedAt(); }
    public void UpdateRating(decimal newRating, int newReviewCount) { Rating = newRating; ReviewCount = newReviewCount; SetUpdatedAt(); }
}
