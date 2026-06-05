namespace MLS.Domain.Interfaces;

public record GoogleUserInfo(
    string GoogleId,
    string Email,
    string FullName,
    string? PictureUrl
);

public interface IGoogleAuthService
{
    /// <summary>
    /// Validates a Google ID token (from frontend) and returns the payload.
    /// Throws UnauthorizedException if token is invalid.
    /// </summary>
    Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken ct = default);
}
