namespace MLS.Application.Common.Interfaces;

/// <summary>
/// Abstraction over SignalR hub for sending quiz room events.
/// Implemented in Infrastructure to avoid Application → Infrastructure dependency.
/// </summary>
public interface IQuizNotificationService
{
    Task NotifyRoomAsync(string roomCode, string eventName, object data, CancellationToken ct = default);
    Task NotifyUserAsync(string userId, string eventName, object data, CancellationToken ct = default);
}
