using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;

namespace MLS.Application.Users.Queries;

// ── DTO ───────────────────────────────────────────────────────────────────────
public record SessionDto(
    Guid Id,
    string? DeviceId,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    bool IsCurrentDevice
);

// ── Query ─────────────────────────────────────────────────────────────────────
public record GetSessionsQuery(Guid UserId, string? CurrentDeviceId) : IRequest<List<SessionDto>>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class GetSessionsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionsQuery, List<SessionDto>>
{
    public async Task<List<SessionDto>> Handle(GetSessionsQuery request, CancellationToken cancellationToken)
    {
        var sessions = await db.RefreshTokens
            .Where(rt => rt.UserId == request.UserId && rt.RevokedAt == null && rt.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .Select(rt => new SessionDto(
                rt.Id,
                rt.DeviceId,
                rt.CreatedAt,
                rt.ExpiresAt,
                rt.DeviceId == request.CurrentDeviceId))
            .ToListAsync(cancellationToken);

        return sessions;
    }
}
