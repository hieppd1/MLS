using Microsoft.AspNetCore.SignalR;
using MLS.Application.Common.Interfaces;
using MLS.Infrastructure.Hubs;

namespace MLS.Infrastructure.Services;

public class QuizHubNotificationService(IHubContext<QuizHub> hub) : IQuizNotificationService
{
    public Task NotifyRoomAsync(string roomCode, string eventName, object data, CancellationToken ct = default)
        => hub.Clients.Group($"room_{roomCode}").SendAsync(eventName, data, ct);

    public Task NotifyUserAsync(string userId, string eventName, object data, CancellationToken ct = default)
        => hub.Clients.Group($"user_{userId}").SendAsync(eventName, data, ct);
}
