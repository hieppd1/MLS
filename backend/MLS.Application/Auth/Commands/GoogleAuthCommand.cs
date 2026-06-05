using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Auth.Dtos;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record GoogleAuthCommand(
    string IdToken,
    string? DeviceId = null
) : IRequest<AuthResponseDto>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class GoogleAuthCommandHandler(
    IApplicationDbContext db,
    IGoogleAuthService googleAuthService,
    IJwtService jwtService,
    IMoodleService moodleService) : IRequestHandler<GoogleAuthCommand, AuthResponseDto>
{
    private const int RefreshTokenExpiryDays = 30;
    private const int AccessTokenExpirySeconds = 900;

    public async Task<AuthResponseDto> Handle(GoogleAuthCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify Google ID token
        var googleUser = await googleAuthService.VerifyIdTokenAsync(request.IdToken, cancellationToken);

        // 2. Find existing user by GoogleId or email
        var user = await db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(
                u => u.GoogleId == googleUser.GoogleId || u.Email == googleUser.Email,
                cancellationToken);

        string roleName;
        bool isNewUser;

        if (user is null)
        {
            // 3a. New user — create with Student role
            var studentRole = await db.Roles
                .FirstOrDefaultAsync(r => r.Name == Role.Names.Student, cancellationToken)
                ?? throw new DomainException("Default role 'Student' not found.");

            user = User.CreateWithGoogle(googleUser.Email, googleUser.GoogleId);
            var profile = UserProfile.Create(user.Id, googleUser.FullName);
            var userRole = UserRole.Create(user.Id, studentRole.Id);

            db.Users.Add(user);
            db.UserProfiles.Add(profile);
            db.UserRoles.Add(userRole);

            roleName = studentRole.Name;
            isNewUser = true;
        }
        else
        {
            // 3b. Existing user — link GoogleId if not yet linked
            if (user.GoogleId is null)
                user.LinkGoogle(googleUser.GoogleId);

            if (user.Status == UserStatus.Suspended)
                throw new UnauthorizedException("Account is suspended.");

            roleName = user.UserRoles
                .Select(ur => ur.Role?.Name)
                .FirstOrDefault(n => n != null) ?? Role.Names.Student;
            isNewUser = false;
        }

        // 4. Issue tokens
        var refreshTokenValue = jwtService.GenerateRefreshTokenValue();
        var tokenHash = jwtService.HashToken(refreshTokenValue);
        var refreshToken = RefreshToken.Create(user.Id, tokenHash, RefreshTokenExpiryDays, request.DeviceId);
        db.RefreshTokens.Add(refreshToken);

        await db.SaveChangesAsync(cancellationToken);

        // Sync newly-created Google users to Moodle (non-blocking)
        if (isNewUser)
        {
            var moodleId = await moodleService.CreateUserAsync(
                user.Id, user.Email, user.Profile?.FullName ?? googleUser.FullName, cancellationToken);
            if (moodleId.HasValue)
            {
                user.SetMoodleId(moodleId.Value);
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email, roleName, string.Empty);

        return new AuthResponseDto(
            accessToken,
            refreshTokenValue,
            AccessTokenExpirySeconds,
            new UserInfoDto(user.Id, user.Email, null, user.Profile?.FullName ?? googleUser.FullName, roleName, user.Profile?.PreferredLocale)
        );
    }
}
