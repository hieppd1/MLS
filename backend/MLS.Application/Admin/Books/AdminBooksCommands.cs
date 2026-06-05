using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Books;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateBookCommand(
    string Title,
    string Type,
    decimal Price,
    Guid CreatedBy,
    string? Description = null,
    string? ShortDescription = null,
    string? Author = null,
    string? Publisher = null,
    string? Isbn = null,
    string CoverColor = "#1a3a5c",
    string CoverEmoji = "📚",
    string? CoverUrl = null,
    Guid? CategoryId = null,
    string? Level = null,
    string? Tags = null,
    decimal? DiscountPrice = null,
    DateTime? DiscountEndsAt = null,
    int? PageCount = null,
    string? FileUrl = null,
    decimal? FileSizeMb = null,
    string? SampleUrl = null,
    bool IsFeatured = false,
    int SortOrder = 0
) : IRequest<Guid>;

public record UpdateBookCommand(
    Guid Id,
    string Title,
    string Type,
    decimal Price,
    string? Description = null,
    string? ShortDescription = null,
    string? Author = null,
    string? Publisher = null,
    string? Isbn = null,
    string CoverColor = "#1a3a5c",
    string CoverEmoji = "📚",
    string? CoverUrl = null,
    Guid? CategoryId = null,
    string? Level = null,
    string? Tags = null,
    decimal? DiscountPrice = null,
    DateTime? DiscountEndsAt = null,
    int? PageCount = null,
    string? FileUrl = null,
    decimal? FileSizeMb = null,
    string? SampleUrl = null,
    bool IsFeatured = false,
    int SortOrder = 0
) : IRequest<bool>;

public record DeleteBookCommand(Guid Id) : IRequest<bool>;

public record PublishBookCommand(Guid Id) : IRequest<bool>;
public record UnpublishBookCommand(Guid Id) : IRequest<bool>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class CreateBookHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBookCommand, Guid>
{
    public async Task<Guid> Handle(CreateBookCommand cmd, CancellationToken ct)
    {
        if (!Enum.TryParse<BookType>(cmd.Type, true, out var bookType))
            throw new ArgumentException($"Invalid book type: {cmd.Type}");

        var book = Book.Create(
            title: cmd.Title,
            type: bookType,
            price: cmd.Price,
            createdBy: cmd.CreatedBy,
            description: cmd.Description,
            shortDescription: cmd.ShortDescription,
            author: cmd.Author,
            publisher: cmd.Publisher,
            isbn: cmd.Isbn,
            coverColor: cmd.CoverColor,
            coverEmoji: cmd.CoverEmoji,
            coverUrl: cmd.CoverUrl,
            categoryId: cmd.CategoryId,
            level: cmd.Level,
            tags: cmd.Tags,
            discountPrice: cmd.DiscountPrice,
            discountEndsAt: cmd.DiscountEndsAt,
            pageCount: cmd.PageCount,
            fileUrl: cmd.FileUrl,
            fileSizeMb: cmd.FileSizeMb,
            sampleUrl: cmd.SampleUrl,
            isFeatured: cmd.IsFeatured,
            sortOrder: cmd.SortOrder);

        db.Books.Add(book);
        await db.SaveChangesAsync(ct);
        return book.Id;
    }
}

public class UpdateBookHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateBookCommand, bool>
{
    public async Task<bool> Handle(UpdateBookCommand cmd, CancellationToken ct)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == cmd.Id, ct);
        if (book is null) return false;

        if (!Enum.TryParse<BookType>(cmd.Type, true, out var bookType))
            throw new ArgumentException($"Invalid book type: {cmd.Type}");

        book.Update(
            title: cmd.Title,
            description: cmd.Description,
            shortDescription: cmd.ShortDescription,
            author: cmd.Author,
            publisher: cmd.Publisher,
            isbn: cmd.Isbn,
            type: bookType,
            categoryId: cmd.CategoryId,
            level: cmd.Level,
            tags: cmd.Tags,
            price: cmd.Price,
            discountPrice: cmd.DiscountPrice,
            discountEndsAt: cmd.DiscountEndsAt,
            pageCount: cmd.PageCount,
            fileUrl: cmd.FileUrl,
            fileSizeMb: cmd.FileSizeMb,
            sampleUrl: cmd.SampleUrl,
            coverColor: cmd.CoverColor,
            coverEmoji: cmd.CoverEmoji,
            coverUrl: cmd.CoverUrl,
            isFeatured: cmd.IsFeatured,
            sortOrder: cmd.SortOrder);

        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class DeleteBookHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteBookCommand, bool>
{
    public async Task<bool> Handle(DeleteBookCommand cmd, CancellationToken ct)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == cmd.Id, ct);
        if (book is null) return false;

        db.Books.Remove(book);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class PublishBookHandler(IApplicationDbContext db)
    : IRequestHandler<PublishBookCommand, bool>
{
    public async Task<bool> Handle(PublishBookCommand cmd, CancellationToken ct)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == cmd.Id, ct);
        if (book is null) return false;
        book.Publish();
        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class UnpublishBookHandler(IApplicationDbContext db)
    : IRequestHandler<UnpublishBookCommand, bool>
{
    public async Task<bool> Handle(UnpublishBookCommand cmd, CancellationToken ct)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == cmd.Id, ct);
        if (book is null) return false;
        book.Hide();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
