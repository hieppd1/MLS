using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;

namespace MLS.Application.Users.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record RevokeSessionCommand(Guid UserId, Guid SessionId) : IRequest<Unit>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class RevokeSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<RevokeSessionCommand, Unit>
{
    public async Task<Unit> Handle(RevokeSessionCommand request, CancellationToken cancellationToken)
    {
        var token = await db.RefreshTokens
            .FirstOrDefaultAsync(
                rt => rt.Id == request.SessionId && rt.UserId == request.UserId,
                cancellationToken)
            ?? throw new NotFoundException("Session", request.SessionId);

        token.Revoke();
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
