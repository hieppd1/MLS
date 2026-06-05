using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record LogoutAllCommand(Guid UserId) : IRequest<Unit>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class LogoutAllCommandHandler(IApplicationDbContext db)
    : IRequestHandler<LogoutAllCommand, Unit>
{
    public async Task<Unit> Handle(LogoutAllCommand request, CancellationToken cancellationToken)
    {
        var tokens = await db.RefreshTokens
            .Where(rt => rt.UserId == request.UserId && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
            token.Revoke();

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
