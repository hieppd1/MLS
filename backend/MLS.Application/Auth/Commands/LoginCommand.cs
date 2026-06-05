using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Auth.Dtos;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record LoginCommand(
    string Email,
    string Password,
    string? DeviceId = null
) : IRequest<AuthResponseDto>;

// ── Validator ─────────────────────────────────────────────────────────────────
public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class LoginCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtService jwtService) : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private const int RefreshTokenExpiryDays = 30;
    private const int AccessTokenExpirySeconds = 900;

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var emailLower = request.Email.ToLowerInvariant().Trim();

        var user = await db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken)
            ?? throw new UnauthorizedException("Invalid credentials.");

        if (user.PasswordHash is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid credentials.");

        if (user.Status == UserStatus.Suspended)
            throw new UnauthorizedException("Account is suspended.");

        var roleName = user.UserRoles
            .Select(ur => ur.Role?.Name)
            .FirstOrDefault(n => n != null) ?? Role.Names.Student;

        var refreshTokenValue = jwtService.GenerateRefreshTokenValue();
        var tokenHash = jwtService.HashToken(refreshTokenValue);
        var refreshToken = RefreshToken.Create(user.Id, tokenHash, RefreshTokenExpiryDays, request.DeviceId);
        db.RefreshTokens.Add(refreshToken);

        await db.SaveChangesAsync(cancellationToken);

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email, roleName, string.Empty);

        return new AuthResponseDto(
            accessToken,
            refreshTokenValue,
            AccessTokenExpirySeconds,
            new UserInfoDto(user.Id, user.Email, user.Phone, user.Profile?.FullName ?? emailLower, roleName, user.Profile?.PreferredLocale)
        );
    }
}
