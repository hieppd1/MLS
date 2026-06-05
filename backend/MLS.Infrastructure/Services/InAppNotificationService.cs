using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using MLS.Infrastructure.Hubs;

namespace MLS.Infrastructure.Services;

/// <summary>
/// Saves notification to DB, pushes via SignalR, optionally sends FCM push if user is offline.
/// </summary>
public class InAppNotificationService(
    IApplicationDbContext db,
    IHubContext<NotificationHub> hub,
    IFcmPushService fcm,
    ILogger<InAppNotificationService> logger) : IInAppNotificationService
{
    public async Task NotifyAsync(
        string tenantSlug,
        Guid userId,
        string type,
        string title,
        string body,
        string? linkUrl = null,
        CancellationToken ct = default)
    {
        // Persist
        var notification = Notification.Create(userId, type, title, body, linkUrl);
        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);

        var dto = new
        {
            id = notification.Id,
            type = notification.Type,
            title = notification.Title,
            body = notification.Body,
            linkUrl = notification.LinkUrl,
            isRead = notification.IsRead,
            createdAt = notification.CreatedAt,
        };

        // Push via SignalR (in-app)
        var group = NotificationHub.BuildUserGroup(tenantSlug, userId.ToString());
        await hub.Clients.Group(group).SendAsync("NotificationReceived", dto, ct);

        // Count unread and push count update
        var unread = await db.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);
        await hub.Clients.Group(group).SendAsync("UnreadCountUpdated", new { count = unread }, ct);

        // FCM push (fire-and-forget — don't block if it fails)
        _ = TryPushFcmAsync(userId, title, body, linkUrl, ct);
    }

    private async Task TryPushFcmAsync(Guid userId, string title, string body, string? linkUrl, CancellationToken ct)
    {
        try
        {
            var tokens = await db.UserDeviceTokens
                .Where(t => t.UserId == userId)
                .Select(t => t.Token)
                .ToListAsync(ct);

            if (tokens.Count == 0) return;

            var data = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(linkUrl)) data["url"] = linkUrl;

            await fcm.SendAsync(tokens, title, body, data, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "FCM push failed for user {UserId}", userId);
        }
    }

    public async Task NotifyByTemplateAsync(
        string tenantSlug,
        Guid userId,
        string templateKey,
        string type,
        Dictionary<string, string> variables,
        string locale = "vi",
        string? linkUrl = null,
        CancellationToken ct = default)
    {
        // Look up template: preferred locale → fallback vi
        var template = await db.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Key == templateKey && t.Locale == locale, ct)
            ?? await db.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Key == templateKey && t.Locale == "vi", ct);

        if (template is null)
        {
            logger.LogWarning("NotificationTemplate '{Key}' not found for locale '{Locale}'", templateKey, locale);
            return;
        }

        // Substitute {{variableName}} placeholders
        var title = variables.Aggregate(template.Title,
            (s, kv) => s.Replace("{{" + kv.Key + "}}", kv.Value));
        var body = variables.Aggregate(template.Body,
            (s, kv) => s.Replace("{{" + kv.Key + "}}", kv.Value));

        await NotifyAsync(tenantSlug, userId, type, title, body, linkUrl, ct);
    }
}
