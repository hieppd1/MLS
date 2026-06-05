using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MLS.Infrastructure.Hubs;

[AllowAnonymous]
public class VideoCommentHub : Hub
{
    public async Task JoinVideoRoom(string sessionId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");

    public async Task LeaveVideoRoom(string sessionId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"session_{sessionId}");
}
