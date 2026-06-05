using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record LogoutCommand(string RefreshToken) : IRequest<Unit>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class LogoutCommandHandler(
    IApplicationDbContext db,
    IJwtService jwtService) : IRequestHandler<LogoutCommand, Unit>
{
    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = jwtService.HashToken(request.RefreshToken);

        var token = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken)
            ?? throw new NotFoundException("RefreshToken", "provided token");

        token.Revoke();
        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
