namespace MLS.Domain.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetAsync(string toEmail, string toName, string resetToken, CancellationToken ct = default);
    Task SendEmailVerificationAsync(string toEmail, string toName, string otp, CancellationToken ct = default);
    Task SendWelcomeAsync(string toEmail, string toName, CancellationToken ct = default);
    Task SendInvitationAsync(string toEmail, string inviterName, string tenantName, string inviteLink, CancellationToken ct = default);
    Task SendOrderConfirmationAsync(string toEmail, string toName, string orderCode, decimal finalAmount, CancellationToken ct = default);

    // Phase 6.7: Notification emails
    Task SendGroupJoinApprovedAsync(string toEmail, string toName, string groupName, string groupUrl, CancellationToken ct = default);
    Task SendGroupJoinRequestAsync(string ownerEmail, string ownerName, string requesterName, string groupName, string groupUrl, CancellationToken ct = default);
    Task SendNewMessageDigestAsync(string toEmail, string toName, string groupName, int unreadCount, string groupUrl, CancellationToken ct = default);
    Task SendQaNewReplyAsync(string toEmail, string toName, string lessonName, string lessonUrl, CancellationToken ct = default);
}

