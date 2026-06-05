using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using MLS.Domain.Common;
using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.Auth;

public class GoogleAuthService(IConfiguration configuration) : IGoogleAuthService
{
    public async Task<GoogleUserInfo> VerifyIdTokenAsync(string idToken, CancellationToken ct = default)
    {
        var clientId = configuration["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId is not configured.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedException($"Invalid Google token: {ex.Message}");
        }

        return new GoogleUserInfo(
            GoogleId: payload.Subject,
            Email: payload.Email,
            FullName: payload.Name ?? payload.Email,
            PictureUrl: payload.Picture
        );
    }
}
