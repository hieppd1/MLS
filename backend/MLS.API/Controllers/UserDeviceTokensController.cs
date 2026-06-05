using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/me/device-tokens")]
[Authorize]
public class UserDeviceTokensController(IApplicationDbContext db, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    public record RegisterTokenRequest(string Token, string Platform);

    /// <summary>Register or update FCM device token. Upserts by (UserId, Platform).</summary>
    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterTokenRequest body, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(body.Token))
            return BadRequest(new { message = loc["TokenRequired"].Value });

        var platform = body.Platform?.ToLowerInvariant() ?? "web";
        var existing = await db.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.UserId == CurrentUserId && t.Platform == platform, ct);

        if (existing is not null)
            existing.UpdateToken(body.Token);
        else
            db.UserDeviceTokens.Add(UserDeviceToken.Create(CurrentUserId, body.Token, platform));

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Unregister FCM token (on logout).</summary>
    [HttpDelete]
    public async Task<IActionResult> Unregister([FromQuery] string platform = "web", CancellationToken ct = default)
    {
        var token = await db.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.UserId == CurrentUserId && t.Platform == platform.ToLowerInvariant(), ct);

        if (token is not null)
        {
            db.UserDeviceTokens.Remove(token);
            await db.SaveChangesAsync(ct);
        }

        return NoContent();
    }
}
