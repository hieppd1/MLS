using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Books;

// ── DTO ──────────────────────────────────────────────────────────────────────

public record BookTranslationDto(
    string Locale,
    string? Title,
    string? ShortDescription,
    string? Description,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

// ── Query: list translations of a book ───────────────────────────────────────

public record GetBookTranslationsQuery(Guid BookId) : IRequest<List<BookTranslationDto>>;

public class GetBookTranslationsHandler(IApplicationDbContext db)
    : IRequestHandler<GetBookTranslationsQuery, List<BookTranslationDto>>
{
    public async Task<List<BookTranslationDto>> Handle(GetBookTranslationsQuery q, CancellationToken ct)
    {
        return await db.BookTranslations
            .Where(t => t.BookId == q.BookId)
            .OrderBy(t => t.Locale)
            .Select(t => new BookTranslationDto(
                t.Locale, t.Title, t.ShortDescription, t.Description,
                t.CreatedAt, t.UpdatedAt))
            .ToListAsync(ct);
    }
}

// ── Command: upsert one translation ──────────────────────────────────────────

public record UpsertBookTranslationCommand(
    Guid BookId,
    string Locale,
    string? Title,
    string? ShortDescription,
    string? Description
) : IRequest;

public class UpsertBookTranslationValidator : AbstractValidator<UpsertBookTranslationCommand>
{
    private static readonly string[] AllowedLocales = ["en", "ko", "vi"];

    public UpsertBookTranslationValidator()
    {
        RuleFor(x => x.Locale).Must(l => AllowedLocales.Contains(l))
            .WithMessage("Locale must be one of: vi, en, ko");
        RuleFor(x => x.BookId).NotEmpty();
    }
}

public class UpsertBookTranslationHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertBookTranslationCommand>
{
    public async Task Handle(UpsertBookTranslationCommand req, CancellationToken ct)
    {
        var existing = await db.BookTranslations
            .FirstOrDefaultAsync(t => t.BookId == req.BookId && t.Locale == req.Locale, ct);

        if (existing is null)
        {
            db.BookTranslations.Add(new BookTranslation
            {
                BookId           = req.BookId,
                Locale           = req.Locale,
                Title            = req.Title?.Trim(),
                ShortDescription = req.ShortDescription?.Trim(),
                Description      = req.Description?.Trim(),
                CreatedAt        = DateTime.UtcNow
            });
        }
        else
        {
            existing.Title            = req.Title?.Trim();
            existing.ShortDescription = req.ShortDescription?.Trim();
            existing.Description      = req.Description?.Trim();
            existing.UpdatedAt        = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }
}
