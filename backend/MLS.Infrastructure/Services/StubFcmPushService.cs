using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.Services;

/// <summary>
/// Stub FCM push service — logs to console in development.
/// Replace with FirebaseAdmin implementation in production:
///   1. Install FirebaseAdmin NuGet package
///   2. Set FIREBASE_SERVICE_ACCOUNT env var (JSON content or file path)
///   3. Replace this class body with FirebaseMessaging.DefaultInstance.SendMulticastAsync(...)
/// </summary>
public class StubFcmPushService(ILogger<StubFcmPushService> logger) : IFcmPushService
{
    public Task SendAsync(
        IEnumerable<string> tokens,
        string title,
        string body,
        IDictionary<string, string>? data = null,
        CancellationToken ct = default)
    {
        var tokenList = tokens.ToList();
        logger.LogInformation(
            "[FCM STUB] Push to {Count} device(s) — Title: {Title} | Body: {Body}",
            tokenList.Count, title, body);
        return Task.CompletedTask;
    }
}
