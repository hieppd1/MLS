namespace MLS.Application.Common.Interfaces;

/// <summary>
/// In-app notification service — saves notification to DB and pushes via SignalR NotificationHub.
/// </summary>
public interface IInAppNotificationService
{
    Task NotifyAsync(
        string tenantSlug,
        Guid userId,
        string type,
        string title,
        string body,
        string? linkUrl = null,
        CancellationToken ct = default);

    /// <summary>
    /// Look up a NotificationTemplate by key + locale, substitute {{variables}}, then notify.
    /// Falls back to "vi" template if locale template doesn't exist.
    /// </summary>
    Task NotifyByTemplateAsync(
        string tenantSlug,
        Guid userId,
        string templateKey,
        string type,
        Dictionary<string, string> variables,
        string locale = "vi",
        string? linkUrl = null,
        CancellationToken ct = default);
}

