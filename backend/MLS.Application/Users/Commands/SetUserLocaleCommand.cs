using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;

namespace MLS.Application.Users.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record SetUserLocaleCommand(Guid UserId, string Locale) : IRequest;

// ── Validator ─────────────────────────────────────────────────────────────────
public class SetUserLocaleCommandValidator : AbstractValidator<SetUserLocaleCommand>
{
    private static readonly string[] Supported = ["vi", "en", "ko"];

    public SetUserLocaleCommandValidator()
    {
        RuleFor(x => x.Locale)
            .NotEmpty()
            .Must(l => Supported.Contains(l))
            .WithMessage($"Locale must be one of: {string.Join(", ", Supported)}.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class SetUserLocaleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SetUserLocaleCommand>
{
    public async Task Handle(SetUserLocaleCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

        if (user.Profile is null)
        {
            var profile = Domain.Entities.UserProfile.Create(user.Id, user.Email ?? string.Empty);
            profile.SetPreferredLocale(request.Locale);
            db.UserProfiles.Add(profile);
        }
        else
        {
            user.Profile.SetPreferredLocale(request.Locale);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
