using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MLS.Infrastructure.Hubs;

/// <summary>
/// Shared hub for Phase 3B/3C: AI grading push (Speaking/Writing) + Realtime Quiz events.
/// Reused by OPIC and VSTEP modes — each mode adds its own event methods.
/// </summary>
[AllowAnonymous]
public class QuizHub : Hub
{
    // Users join their personal group so we can push grading results to them specifically.
    public async Task JoinUserGroup(string userId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

    public async Task LeaveUserGroup(string userId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

    // Realtime quiz room support (Sprint 9-10)
    public async Task JoinRoom(string roomCode)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomCode}");

    public async Task LeaveRoom(string roomCode)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomCode}");
}
