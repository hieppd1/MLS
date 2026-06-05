using System.Security.Cryptography;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record ForgotPasswordCommand(string Email) : IRequest<Unit>;

// ── Validator ─────────────────────────────────────────────────────────────────
public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
public class ForgotPasswordCommandHandler(
    IApplicationDbContext db,
    IEmailService emailService) : IRequestHandler<ForgotPasswordCommand, Unit>
{
    private const int TokenExpiryMinutes = 15;

    public async Task<Unit> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var emailLower = request.Email.ToLowerInvariant().Trim();

        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == emailLower, cancellationToken);

        // Return silently if user not found — prevents email enumeration
        if (user is null) return Unit.Value;

        // Generate a secure random token
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var tokenHash = Convert.ToHexString(
            SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken))
        ).ToLowerInvariant();

        // Invalidate any existing reset tokens for this user
        var existing = await db.OtpVerifications
            .Where(o => o.Target == emailLower && o.Type == OtpType.PasswordReset && !o.IsUsed)
            .ToListAsync(cancellationToken);
        foreach (var old in existing) old.MarkUsed();

        var otp = OtpVerification.Create(emailLower, tokenHash, OtpType.PasswordReset, TokenExpiryMinutes);
        db.OtpVerifications.Add(otp);
        await db.SaveChangesAsync(cancellationToken);

        var fullName = user.Profile?.FullName ?? emailLower;
        await emailService.SendPasswordResetAsync(emailLower, fullName, rawToken, cancellationToken);

        return Unit.Value;
    }
}
