using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MLS.Infrastructure.Hubs;

/// <summary>
/// Support chat hub for 1-1 conversations between Student and Support agent.
/// </summary>
[Authorize]
public class SupportChatHub : Hub
{
    public Task JoinConversation(string conversationId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, conversationId);
        return Groups.AddToGroupAsync(Context.ConnectionId, name);
    }

    public Task LeaveConversation(string conversationId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, conversationId);
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, name);
    }

    public Task Typing(string conversationId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, conversationId);
        var userId = Context.User?.FindFirst("sub")?.Value
                     ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Clients.OthersInGroup(name).SendAsync("UserTyping", new { conversationId, userId });
    }

    public static string BuildGroupName(string tenantSlug, string conversationId)
        => $"tenant:{tenantSlug}:support:{conversationId}";

    private string GetTenantSlug()
    {
        var slug = Context.User?.FindFirst("tenant_slug")?.Value
                   ?? Context.User?.FindFirst("tenant")?.Value
                   ?? Context.GetHttpContext()?.Request.Query["tenant"].ToString();
        return string.IsNullOrWhiteSpace(slug) ? "demo" : slug;
    }
}
