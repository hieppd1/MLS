using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MLS.Infrastructure.Hubs;

/// <summary>
/// Per-user notification hub. Server pushes "NotificationReceived" and "UnreadCountUpdated".
/// Clients connect with JWT and are auto-joined to their personal group.
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var tenant = GetTenantSlug();
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, BuildUserGroup(tenant, userId));

        await base.OnConnectedAsync();
    }

    public static string BuildUserGroup(string tenantSlug, string userId)
        => $"tenant:{tenantSlug}:user:{userId}";

    private string? GetUserId()
        => Context.User?.FindFirst("sub")?.Value
           ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string GetTenantSlug()
    {
        var slug = Context.User?.FindFirst("tenant_slug")?.Value
                   ?? Context.User?.FindFirst("tenant")?.Value
                   ?? Context.GetHttpContext()?.Request.Query["tenant"].ToString();
        return string.IsNullOrWhiteSpace(slug) ? "demo" : slug;
    }
}
