namespace MLS.Domain.Interfaces;

/// <summary>
/// FCM push notification service.
/// Default implementation is a console stub; replace with FirebaseAdmin implementation in production.
/// </summary>
public interface IFcmPushService
{
    Task SendAsync(IEnumerable<string> tokens, string title, string body, IDictionary<string, string>? data = null, CancellationToken ct = default);
}
