using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using System.Globalization;

namespace MLS.Application.Books.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record BookCategoryDto(Guid Id, string Name, string Slug, int BookCount);

public record BookListItemDto(
    Guid Id,
    string Title,
    string Slug,
    string? ShortDescription,
    string? Author,
    string CoverColor,
    string CoverEmoji,
    string? CoverUrl,
    string Type,
    string? Level,
    decimal Price,
    decimal? DiscountPrice,
    decimal Rating,
    int ReviewCount,
    int PurchaseCount,
    Guid? CategoryId,
    string? CategoryName,
    bool IsFeatured
);

public record BookDetailDto(
    Guid Id,
    string Title,
    string Slug,
    string? Description,
    string? ShortDescription,
    string? Author,
    string? Publisher,
    string? Isbn,
    string CoverColor,
    string CoverEmoji,
    string? CoverUrl,
    string Type,
    string? Level,
    string? Tags,
    decimal Price,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    int? PageCount,
    decimal? FileSizeMb,
    string? SampleUrl,
    decimal Rating,
    int ReviewCount,
    int PurchaseCount,
    Guid? CategoryId,
    string? CategoryName,
    bool IsFeatured,
    bool IsOwned,
    DateTime CreatedAt
);

public record BookListResult(List<BookListItemDto> Items, int Total, int Page, int PageSize);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetPublicBooksQuery(
    int Page = 1,
    int PageSize = 12,
    string? Search = null,
    Guid? CategoryId = null,
    string? Type = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    decimal? MinRating = null,
    string? Sort = "newest",
    Guid? UserId = null
) : IRequest<BookListResult>;

public record GetBookBySlugQuery(string Slug, Guid? UserId = null) : IRequest<BookDetailDto?>;

public record GetBookCategoriesQuery : IRequest<List<BookCategoryDto>>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class GetPublicBooksHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublicBooksQuery, BookListResult>
{
    public async Task<BookListResult> Handle(GetPublicBooksQuery q, CancellationToken ct)
    {
        var query = db.Books
            .Include(b => b.Category)
            .Where(b => b.Status == BookStatus.Published)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim().ToLower();
            query = query.Where(b =>
                b.Title.ToLower().Contains(term) ||
                (b.Author != null && b.Author.ToLower().Contains(term)) ||
                (b.ShortDescription != null && b.ShortDescription.ToLower().Contains(term)));
        }

        if (q.CategoryId.HasValue)
            query = query.Where(b => b.CategoryId == q.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(q.Type))
        {
            var bookType = q.Type.ToLower() switch
            {
                "ebook"    => BookType.Ebook,
                "physical" => BookType.Physical,
                "combo"    => BookType.Combo,
                _          => (BookType?)null,
            };
            if (bookType.HasValue)
                query = query.Where(b => b.Type == bookType.Value);
        }

        if (q.MinPrice.HasValue) query = query.Where(b => b.Price >= q.MinPrice.Value);
        if (q.MaxPrice.HasValue) query = query.Where(b => b.Price <= q.MaxPrice.Value);
        if (q.MinRating.HasValue) query = query.Where(b => b.Rating >= q.MinRating.Value);

        query = q.Sort switch
        {
            "price-asc"  => query.OrderBy(b => b.Price),
            "price-desc" => query.OrderByDescending(b => b.Price),
            "rating"     => query.OrderByDescending(b => b.Rating),
            "popular"    => query.OrderByDescending(b => b.PurchaseCount),
            _            => query.OrderByDescending(b => b.IsFeatured).ThenByDescending(b => b.CreatedAt),
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(b => new BookListItemDto(
                b.Id, b.Title, b.Slug, b.ShortDescription, b.Author,
                b.CoverColor, b.CoverEmoji, b.CoverUrl,
                b.Type.ToString(), b.Level,
                b.Price, b.DiscountPrice,
                b.Rating, b.ReviewCount, b.PurchaseCount,
                b.CategoryId, b.Category != null ? b.Category.Name : null,
                b.IsFeatured))
            .ToListAsync(ct);

        return new BookListResult(items, total, q.Page, q.PageSize);
    }
}

public class GetBookBySlugHandler(IApplicationDbContext db)
    : IRequestHandler<GetBookBySlugQuery, BookDetailDto?>
{
    public async Task<BookDetailDto?> Handle(GetBookBySlugQuery q, CancellationToken ct)
    {
        var book = await db.Books
            .Include(b => b.Category)
            .Where(b => b.Slug == q.Slug && b.Status == BookStatus.Published)
            .FirstOrDefaultAsync(ct);

        if (book == null) return null;

        var isOwned = q.UserId.HasValue && await db.EbookEntitlements
            .AnyAsync(e => e.UserId == q.UserId.Value && e.BookId == book.Id, ct);

        // III-10: apply i18n translation (fallback chain: ko → en → vi)
        var locale = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        var chain = locale switch
        {
            "ko" => new[] { "ko", "en" },
            "en" => new[] { "en" },
            _    => System.Array.Empty<string>()
        };
        var translations = chain.Length > 0
            ? await db.BookTranslations
                .Where(t => t.BookId == book.Id && chain.Contains(t.Locale))
                .ToListAsync(ct)
            : new List<BookTranslation>();
        string? Pick(System.Func<BookTranslation, string?> sel)
        {
            foreach (var loc in chain)
            {
                var hit = translations.FirstOrDefault(t => t.Locale == loc);
                var val = hit is null ? null : sel(hit);
                if (!string.IsNullOrWhiteSpace(val)) return val;
            }
            return null;
        }
        var title            = Pick(t => t.Title)            ?? book.Title;
        var description      = Pick(t => t.Description)      ?? book.Description;
        var shortDescription = Pick(t => t.ShortDescription) ?? book.ShortDescription;

        return new BookDetailDto(
            book.Id, title, book.Slug,
            description, shortDescription,
            book.Author, book.Publisher, book.Isbn,
            book.CoverColor, book.CoverEmoji, book.CoverUrl,
            book.Type.ToString(), book.Level, book.Tags,
            book.Price, book.DiscountPrice, book.DiscountEndsAt,
            book.PageCount, book.FileSizeMb, book.SampleUrl,
            book.Rating, book.ReviewCount, book.PurchaseCount,
            book.CategoryId, book.Category?.Name,
            book.IsFeatured, isOwned, book.CreatedAt);
    }
}

public class GetBookCategoriesHandler(IApplicationDbContext db)
    : IRequestHandler<GetBookCategoriesQuery, List<BookCategoryDto>>
{
    public async Task<List<BookCategoryDto>> Handle(GetBookCategoriesQuery q, CancellationToken ct)
    {
        return await db.BookCategories
            .OrderBy(c => c.SortOrder)
            .Select(c => new BookCategoryDto(
                c.Id,
                c.Name,
                c.Slug,
                db.Books.Count(b => b.CategoryId == c.Id && b.Status == BookStatus.Published)))
            .ToListAsync(ct);
    }
}
