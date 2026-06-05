using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Auth.Dtos;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record RefreshTokenCommand(
    string RefreshToken,
    string? DeviceId = null
) : IRequest<AuthResponseDto>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class RefreshTokenCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService) : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private const int RefreshTokenExpiryDays = 30;
    private const int AccessTokenExpirySeconds = 900;

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = jwtService.HashToken(request.RefreshToken);

        var existing = await db.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u!.Profile)
            .Include(rt => rt.User)
                .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (!existing.IsActive)
            throw new UnauthorizedException("Refresh token has expired or been revoked.");

        var user = existing.User!;

        if (user.Status == UserStatus.Suspended)
            throw new UnauthorizedException("Account is suspended.");

        // Rotate: revoke old, issue new
        existing.Revoke();

        var newTokenValue = jwtService.GenerateRefreshTokenValue();
        var newTokenHash = jwtService.HashToken(newTokenValue);
        var newRefreshToken = RefreshToken.Create(user.Id, newTokenHash, RefreshTokenExpiryDays, request.DeviceId ?? existing.DeviceId);
        db.RefreshTokens.Add(newRefreshToken);

        await db.SaveChangesAsync(cancellationToken);

        var roleName = user.UserRoles
            .Select(ur => ur.Role?.Name)
            .FirstOrDefault(n => n != null) ?? Role.Names.Student;

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email, roleName, string.Empty);

        return new AuthResponseDto(
            accessToken,
            newTokenValue,
            AccessTokenExpirySeconds,
            new UserInfoDto(user.Id, user.Email, user.Phone, user.Profile?.FullName ?? user.Email, roleName, user.Profile?.PreferredLocale)
        );
    }
}
