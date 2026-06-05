using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Auth.Dtos;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ──────────────────────────────────────────────────────────────────
public record RegisterCommand(
    string Email,
    string Password,
    string FullName
) : IRequest<AuthResponseDto>;

// ── Validator ─────────────────────────────────────────────────────────────────
public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().EmailAddress().MaximumLength(255);

        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8).MaximumLength(128)
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches(@"\d").WithMessage("Password must contain at least one digit.");

        RuleFor(x => x.FullName)
            .NotEmpty().MinimumLength(2).MaximumLength(100);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class RegisterCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtService jwtService,
    IMoodleService moodleService) : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private const int RefreshTokenExpiryDays = 30;
    private const int AccessTokenExpirySeconds = 900; // 15 min

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailLower = request.Email.ToLowerInvariant().Trim();

        var emailExists = await db.Users
            .AnyAsync(u => u.Email == emailLower, cancellationToken);

        if (emailExists)
            throw new ConflictException("Email is already registered.");

        // Assign Student role by default
        var studentRole = await db.Roles
            .FirstOrDefaultAsync(r => r.Name == Role.Names.Student, cancellationToken)
            ?? throw new DomainException("Default role 'Student' not found. Ensure tenant is properly provisioned.");

        var passwordHash = passwordHasher.Hash(request.Password);
        var user = User.CreateWithEmail(emailLower, passwordHash);

        var profile = UserProfile.Create(user.Id, request.FullName);
        var userRole = UserRole.Create(user.Id, studentRole.Id);

        db.Users.Add(user);
        db.UserProfiles.Add(profile);
        db.UserRoles.Add(userRole);

        var refreshTokenValue = jwtService.GenerateRefreshTokenValue();
        var tokenHash = jwtService.HashToken(refreshTokenValue);
        var refreshToken = RefreshToken.Create(user.Id, tokenHash, RefreshTokenExpiryDays);
        db.RefreshTokens.Add(refreshToken);

        await db.SaveChangesAsync(cancellationToken);

        // Sync to Moodle (non-blocking — registration succeeds even if Moodle is down or disabled)
        var moodleId = await moodleService.CreateUserAsync(user.Id, user.Email, request.FullName, cancellationToken);
        if (moodleId.HasValue)
        {
            user.SetMoodleId(moodleId.Value);
            await db.SaveChangesAsync(cancellationToken);
        }

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email, studentRole.Name, string.Empty);

        return new AuthResponseDto(
            accessToken,
            refreshTokenValue,
            AccessTokenExpirySeconds,
            new UserInfoDto(user.Id, user.Email, user.Phone, request.FullName, studentRole.Name, null)
        );
    }
}
