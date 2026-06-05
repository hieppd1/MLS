using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Users.Dtos;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Users.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record UpdateProfileCommand(
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Address,
    string? CurrentLevel,
    string? Phone
) : IRequest<UserProfileDto>;

// ── Validator ─────────────────────────────────────────────────────────────────
public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.AvatarUrl).MaximumLength(512).When(x => x.AvatarUrl is not null);
        RuleFor(x => x.CurrentLevel).MaximumLength(50).When(x => x.CurrentLevel is not null);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class UpdateProfileCommandHandler(
    IApplicationDbContext db,
    IMoodleService moodleService) : IRequestHandler<UpdateProfileCommand, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        if (!string.IsNullOrWhiteSpace(request.Phone))
            user.SetPhone(request.Phone);

        if (user.Profile is null)
        {
            var newProfile = UserProfile.Create(user.Id, request.FullName);
            newProfile.Update(request.FullName, request.AvatarUrl, request.DateOfBirth, request.Gender, request.Address, request.CurrentLevel);
            db.UserProfiles.Add(newProfile);
        }
        else
        {
            user.Profile.Update(request.FullName, request.AvatarUrl, request.DateOfBirth, request.Gender, request.Address, request.CurrentLevel);
        }

        await db.SaveChangesAsync(cancellationToken);

        // Sync updated name to Moodle if this user has a linked Moodle account
        if (user.MoodleUserId.HasValue)
            await moodleService.UpdateUserAsync(user.MoodleUserId.Value, request.FullName, cancellationToken);

        var roleName = user.UserRoles
            .Select(ur => ur.Role?.Name)
            .FirstOrDefault(n => n != null) ?? Role.Names.Student;

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.Phone,
            request.FullName,
            request.AvatarUrl,
            request.DateOfBirth,
            request.Gender,
            request.Address,
            request.CurrentLevel,
            roleName,
            user.CreatedAt,
            user.Profile?.PreferredLocale
        );
    }
}
