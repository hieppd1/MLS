using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Courses.Commands;

// ── Upsert Course Translation ─────────────────────────────────────────────────

public record UpsertCourseTranslationCommand(
    Guid CourseId,
    string Locale,
    string? Title,
    string? ShortDescription,
    string? Description,
    string? Outcomes,
    string? Requirements,
    string? TargetAudience
) : IRequest;

public class UpsertCourseTranslationValidator : AbstractValidator<UpsertCourseTranslationCommand>
{
    private static readonly string[] AllowedLocales = ["en", "ko", "vi"];

    public UpsertCourseTranslationValidator()
    {
        RuleFor(x => x.Locale).Must(l => AllowedLocales.Contains(l))
            .WithMessage("Locale must be one of: vi, en, ko");
        RuleFor(x => x.CourseId).NotEmpty();
    }
}

public class UpsertCourseTranslationHandler(IApplicationDbContext db)
    : IRequestHandler<UpsertCourseTranslationCommand>
{
    public async Task Handle(UpsertCourseTranslationCommand req, CancellationToken ct)
    {
        var existing = await db.CourseTranslations
            .FirstOrDefaultAsync(t => t.CourseId == req.CourseId && t.Locale == req.Locale, ct);

        if (existing is null)
        {
            db.CourseTranslations.Add(new CourseTranslation
            {
                CourseId         = req.CourseId,
                Locale           = req.Locale,
                Title            = req.Title?.Trim(),
                ShortDescription = req.ShortDescription?.Trim(),
                Description      = req.Description?.Trim(),
                Outcomes         = req.Outcomes,
                Requirements     = req.Requirements,
                TargetAudience   = req.TargetAudience,
                CreatedAt        = DateTime.UtcNow
            });
        }
        else
        {
            existing.Title            = req.Title?.Trim();
            existing.ShortDescription = req.ShortDescription?.Trim();
            existing.Description      = req.Description?.Trim();
            existing.Outcomes         = req.Outcomes;
            existing.Requirements     = req.Requirements;
            existing.TargetAudience   = req.TargetAudience;
            existing.UpdatedAt        = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }
}
