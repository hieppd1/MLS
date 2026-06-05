using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Users.Dtos;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.Users.Queries;

// ── Query ─────────────────────────────────────────────────────────────────────
public record GetMyProfileQuery(Guid UserId) : IRequest<UserProfileDto>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetMyProfileQueryHandler(IApplicationDbContext db) : IRequestHandler<GetMyProfileQuery, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        var roleName = user.UserRoles
            .Select(ur => ur.Role?.Name)
            .FirstOrDefault(n => n != null) ?? Role.Names.Student;

        return new UserProfileDto(
            user.Id,
            user.Email,
            user.Phone,
            user.Profile?.FullName ?? user.Email,
            user.Profile?.AvatarUrl,
            user.Profile?.DateOfBirth,
            user.Profile?.Gender,
            user.Profile?.Address,
            user.Profile?.CurrentLevel,
            roleName,
            user.CreatedAt,
            user.Profile?.PreferredLocale
        );
    }
}
