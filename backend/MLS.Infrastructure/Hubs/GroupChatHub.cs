using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MLS.Infrastructure.Hubs;

/// <summary>
/// Group chat hub. Clients connect with JWT (header or ?access_token=) and call
/// JoinGroup / LeaveGroup / Typing. Server-side broadcasts ("MessageReceived",
/// "MessageDeleted", "MemberJoined", etc.) are emitted from application services
/// via IHubContext{GroupChatHub}.
/// </summary>
[Authorize]
public class GroupChatHub : Hub
{
    public override Task OnConnectedAsync()
    {
        // Auth is enforced via [Authorize]; tenant slug is read from JWT claim.
        return base.OnConnectedAsync();
    }

    public Task JoinGroup(string groupId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, groupId);
        return Groups.AddToGroupAsync(Context.ConnectionId, name);
    }

    public Task LeaveGroup(string groupId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, groupId);
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, name);
    }

    public Task Typing(string groupId)
    {
        var tenant = GetTenantSlug();
        var name = BuildGroupName(tenant, groupId);
        var userId = Context.User?.FindFirst("sub")?.Value
                     ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Clients.OthersInGroup(name).SendAsync("UserTyping", new { groupId, userId });
    }

    public static string BuildGroupName(string tenantSlug, string groupId)
        => $"tenant:{tenantSlug}:group:{groupId}";

    private string GetTenantSlug()
    {
        var slug = Context.User?.FindFirst("tenant_slug")?.Value
                   ?? Context.User?.FindFirst("tenant")?.Value
                   ?? Context.GetHttpContext()?.Request.Query["tenant"].ToString();
        return string.IsNullOrWhiteSpace(slug) ? "demo" : slug;
    }
}
