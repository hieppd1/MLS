using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.Email;

/// <summary>
/// Stub email service — logs emails to console in development.
/// Replace with SendGrid implementation before production.
/// Set Email:Provider = "SendGrid" and Email:SendGridApiKey in appsettings.
/// </summary>
public class ConsoleEmailService(
    IConfiguration configuration,
    ILogger<ConsoleEmailService> logger) : IEmailService
{
    private readonly string _fromEmail = configuration["Email:From"] ?? "noreply@mls.app";
    private readonly string _appName = configuration["Email:AppName"] ?? "MLS";
    private readonly string _frontendUrl = configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";

    public Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default)
    {
        var resetUrl = $"{_frontendUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";
        logger.LogInformation(
            "[EMAIL STUB] Password reset for {Email} — URL: {Url}",
            toEmail, resetUrl);
        return Task.CompletedTask;
    }

    public Task SendEmailVerificationAsync(string toEmail, string toName, string otp, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] Verification OTP for {Email} — Code: {Otp}",
            toEmail, otp);
        return Task.CompletedTask;
    }

    public Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default)
    {
        logger.LogInformation("[EMAIL STUB] Welcome email to {Email}", toEmail);
        return Task.CompletedTask;
    }

    public Task SendInvitationAsync(string toEmail, string inviterName, string tenantName, string inviteLink, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] Invitation for {Email} from {Inviter} ({Tenant}) — Link: {Link}",
            toEmail, inviterName, tenantName, inviteLink);
        return Task.CompletedTask;
    }

    public Task SendOrderConfirmationAsync(string toEmail, string toName, string orderCode, decimal finalAmount, CancellationToken ct = default)
    {
        var orderUrl = $"{_frontendUrl}/don-hang";
        logger.LogInformation(
            "[EMAIL STUB] Order confirmation to {Email} — Order: {OrderCode}, Amount: {Amount:N0}đ, URL: {Url}",
            toEmail, orderCode, finalAmount, orderUrl);
        return Task.CompletedTask;
    }

    // ── Phase 6.7: Notification emails ───────────────────────────────────────

    public Task SendGroupJoinApprovedAsync(string toEmail, string toName, string groupName, string groupUrl, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] GroupJoinApproved to {Email} — Group: {Group}, URL: {Url}",
            toEmail, groupName, groupUrl);
        return Task.CompletedTask;
    }

    public Task SendGroupJoinRequestAsync(string ownerEmail, string ownerName, string requesterName, string groupName, string groupUrl, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] GroupJoinRequest to {Email} — Requester: {Requester}, Group: {Group}",
            ownerEmail, requesterName, groupName);
        return Task.CompletedTask;
    }

    public Task SendNewMessageDigestAsync(string toEmail, string toName, string groupName, int unreadCount, string groupUrl, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] MessageDigest to {Email} — Group: {Group}, Unread: {Count}",
            toEmail, groupName, unreadCount);
        return Task.CompletedTask;
    }

    public Task SendQaNewReplyAsync(string toEmail, string toName, string lessonName, string lessonUrl, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] QANewReply to {Email} — Lesson: {Lesson}, URL: {Url}",
            toEmail, lessonName, lessonUrl);
        return Task.CompletedTask;
    }
}
