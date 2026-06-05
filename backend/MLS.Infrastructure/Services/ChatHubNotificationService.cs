using Microsoft.AspNetCore.SignalR;
using MLS.Application.Common.Interfaces;
using MLS.Infrastructure.Hubs;

namespace MLS.Infrastructure.Services;

public class ChatHubNotificationService(
    IHubContext<GroupChatHub> groupHub,
    IHubContext<SupportChatHub> supportHub) : IChatNotificationService
{
    public Task NotifyGroupAsync(string tenantSlug, Guid groupId, string eventName, object data, CancellationToken ct = default)
    {
        var name = GroupChatHub.BuildGroupName(tenantSlug, groupId.ToString());
        return groupHub.Clients.Group(name).SendAsync(eventName, data, ct);
    }

    public Task NotifySupportAsync(string tenantSlug, Guid conversationId, string eventName, object data, CancellationToken ct = default)
    {
        var name = SupportChatHub.BuildGroupName(tenantSlug, conversationId.ToString());
        return supportHub.Clients.Group(name).SendAsync(eventName, data, ct);
    }
}
