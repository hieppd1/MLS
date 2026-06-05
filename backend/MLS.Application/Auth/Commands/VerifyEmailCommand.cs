using System.Security.Cryptography;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Auth.Commands;

// ── SendVerification Command ──────────────────────────────────────────────────
public record SendVerificationEmailCommand(Guid UserId) : IRequest<Unit>;

public class SendVerificationEmailCommandHandler(
    IApplicationDbContext db,
    IEmailService emailService) : IRequestHandler<SendVerificationEmailCommand, Unit>
{
    private const int OtpExpiryMinutes = 1440; // 24h

    public async Task<Unit> Handle(SendVerificationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        if (user.Status != UserStatus.PendingVerification)
            return Unit.Value; // already verified, silently ignore

        var emailLower = user.Email;

        // Invalidate existing pending verifications for this email
        var existing = await db.OtpVerifications
            .Where(o => o.Target == emailLower && o.Type == OtpType.EmailVerification && !o.IsUsed)
            .ToListAsync(cancellationToken);
        foreach (var old in existing) old.MarkUsed();

        // Generate 6-digit OTP
        var rawOtp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var otpHash = Convert.ToHexString(
            SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawOtp))
        ).ToLowerInvariant();

        var otp = OtpVerification.Create(emailLower, otpHash, OtpType.EmailVerification, OtpExpiryMinutes);
        db.OtpVerifications.Add(otp);
        await db.SaveChangesAsync(cancellationToken);

        var fullName = user.Profile?.FullName ?? emailLower;
        await emailService.SendEmailVerificationAsync(emailLower, fullName, rawOtp, cancellationToken);

        return Unit.Value;
    }
}

// ── VerifyEmail Command ────────────────────────────────────────────────────────
public record VerifyEmailCommand(Guid UserId, string Code) : IRequest<Unit>;

public class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().Length(6).Matches(@"^\d{6}$")
            .WithMessage("Verification code must be 6 digits.");
    }
}

public class VerifyEmailCommandHandler(IApplicationDbContext db)
    : IRequestHandler<VerifyEmailCommand, Unit>
{
    public async Task<Unit> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        var codeHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(request.Code))
        ).ToLowerInvariant();

        var otp = await db.OtpVerifications
            .Where(o => o.Target == user.Email
                     && o.Type == OtpType.EmailVerification
                     && o.CodeHash == codeHash)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new UnauthorizedException("Invalid verification code.");

        if (!otp.IsValid)
            throw new UnauthorizedException("Verification code has expired or already been used.");

        user.Activate();
        otp.MarkUsed();
        await db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
