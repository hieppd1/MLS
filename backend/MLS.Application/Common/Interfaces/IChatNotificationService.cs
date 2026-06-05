namespace MLS.Application.Common.Interfaces;

/// <summary>
/// Broadcast SignalR events for chat. Implementation lives in Infrastructure
/// (wraps IHubContext{GroupChatHub} / IHubContext{SupportChatHub}).
/// </summary>
public interface IChatNotificationService
{
    Task NotifyGroupAsync(string tenantSlug, Guid groupId, string eventName, object data, CancellationToken ct = default);
    Task NotifySupportAsync(string tenantSlug, Guid conversationId, string eventName, object data, CancellationToken ct = default);
}
