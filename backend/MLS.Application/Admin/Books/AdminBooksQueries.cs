using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Books;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record AdminBookListItemDto(
    Guid Id,
    string Title,
    string Slug,
    string Type,
    string Status,
    decimal Price,
    decimal? DiscountPrice,
    string? Author,
    string CoverColor,
    string CoverEmoji,
    string? CoverUrl,
    string? CategoryName,
    bool IsFeatured,
    int PurchaseCount,
    DateTime CreatedAt
);

public record AdminBookDetailDto(
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
    string Status,
    string? Level,
    string? Tags,
    decimal Price,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    int? PageCount,
    string? FileUrl,
    decimal? FileSizeMb,
    string? SampleUrl,
    bool IsFeatured,
    int SortOrder,
    Guid? CategoryId,
    string? CategoryName,
    decimal Rating,
    int ReviewCount,
    int PurchaseCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record AdminBookListResult(List<AdminBookListItemDto> Items, int Total, int Page, int PageSize);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAdminBooksQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null,
    string? Type = null,
    Guid? CategoryId = null
) : IRequest<AdminBookListResult>;

public record GetAdminBookDetailQuery(Guid Id) : IRequest<AdminBookDetailDto?>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class GetAdminBooksHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminBooksQuery, AdminBookListResult>
{
    public async Task<AdminBookListResult> Handle(GetAdminBooksQuery q, CancellationToken ct)
    {
        var query = db.Books
            .Include(b => b.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim().ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(term)
                || (b.Author != null && b.Author.ToLower().Contains(term))
                || (b.Isbn != null && b.Isbn.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(q.Status) && Enum.TryParse<BookStatus>(q.Status, true, out var status))
            query = query.Where(b => b.Status == status);

        if (!string.IsNullOrWhiteSpace(q.Type) && Enum.TryParse<BookType>(q.Type, true, out var type))
            query = query.Where(b => b.Type == type);

        if (q.CategoryId.HasValue)
            query = query.Where(b => b.CategoryId == q.CategoryId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(b => new AdminBookListItemDto(
                b.Id, b.Title, b.Slug,
                b.Type.ToString(), b.Status.ToString(),
                b.Price, b.DiscountPrice,
                b.Author, b.CoverColor, b.CoverEmoji, b.CoverUrl,
                b.Category != null ? b.Category.Name : null,
                b.IsFeatured, b.PurchaseCount, b.CreatedAt))
            .ToListAsync(ct);

        return new AdminBookListResult(items, total, q.Page, q.PageSize);
    }
}

public class GetAdminBookDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminBookDetailQuery, AdminBookDetailDto?>
{
    public async Task<AdminBookDetailDto?> Handle(GetAdminBookDetailQuery q, CancellationToken ct)
    {
        var b = await db.Books
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == q.Id, ct);

        if (b is null) return null;

        return new AdminBookDetailDto(
            b.Id, b.Title, b.Slug,
            b.Description, b.ShortDescription, b.Author, b.Publisher, b.Isbn,
            b.CoverColor, b.CoverEmoji, b.CoverUrl,
            b.Type.ToString(), b.Status.ToString(),
            b.Level, b.Tags, b.Price, b.DiscountPrice, b.DiscountEndsAt,
            b.PageCount, b.FileUrl, b.FileSizeMb, b.SampleUrl,
            b.IsFeatured, b.SortOrder,
            b.CategoryId, b.Category?.Name,
            b.Rating, b.ReviewCount, b.PurchaseCount,
            b.CreatedAt, b.UpdatedAt);
    }
}
