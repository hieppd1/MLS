using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record ResetPasswordCommand(string Token, string NewPassword) : IRequest<Unit>;

// ── Validator ─────────────────────────────────────────────────────────────────
public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty().MinimumLength(8).MaximumLength(128)
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches(@"\d").WithMessage("Password must contain at least one digit.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class ResetPasswordCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher) : IRequestHandler<ResetPasswordCommand, Unit>
{
    public async Task<Unit> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(request.Token))
        ).ToLowerInvariant();

        var otp = await db.OtpVerifications
            .FirstOrDefaultAsync(
                o => o.CodeHash == tokenHash && o.Type == OtpType.PasswordReset,
                cancellationToken)
            ?? throw new UnauthorizedException("Invalid or expired reset token.");

        if (!otp.IsValid)
            throw new UnauthorizedException("Reset token has expired or already been used.");

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == otp.Target, cancellationToken)
            ?? throw new NotFoundException("User", otp.Target);

        user.SetPasswordHash(passwordHasher.Hash(request.NewPassword));
        otp.MarkUsed();

        // Revoke all refresh tokens after password reset
        var tokens = await db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var token in tokens) token.Revoke();

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
