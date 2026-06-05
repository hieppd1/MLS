using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Admin.Teachers;
using MLS.Application.Users.Commands;
using MLS.Application.Users.Queries;
using MLS.Domain.Common;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await mediator.Send(new GetMyProfileQuery(userId), ct);
        return Ok(result);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await mediator.Send(
            new UpdateProfileCommand(userId, request.FullName, request.AvatarUrl, request.DateOfBirth, request.Gender, request.Address, request.CurrentLevel, request.Phone), ct);
        return Ok(result);
    }

    [HttpPost("me/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = loc["NoFileUploaded"].Value });

        var userId = GetCurrentUserId();
        var relativePath = await mediator.Send(
            new UploadAvatarCommand(userId, file.OpenReadStream(), file.FileName, file.ContentType), ct);

        return Ok(new { avatarUrl = relativePath });
    }

    [HttpPut("me/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await mediator.Send(new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword), ct);
        return NoContent();
    }

    [HttpGet("me/sessions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var deviceId = Request.Headers["X-Device-Id"].FirstOrDefault();
        var sessions = await mediator.Send(new GetSessionsQuery(userId, deviceId), ct);
        return Ok(sessions);
    }

    [HttpDelete("me/sessions/{sessionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeSession(Guid sessionId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await mediator.Send(new RevokeSessionCommand(userId, sessionId), ct);
        return NoContent();
    }

    // ── Teacher self-service ──────────────────────────────────────────────────

    [HttpGet("me/teacher-profile")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyTeacherProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await mediator.Send(new GetAdminTeacherDetailQuery(userId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPut("me/teacher-profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateMyTeacherProfile([FromBody] SelfUpdateTeacherProfileRequest req, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await mediator.Send(new UpdateTeacherProfileCommand(
            userId, req.DisplayName, req.Slug, req.Headline, req.Bio,
            req.AvatarUrl, req.CoverUrl, req.ExperienceYears, req.Specialization,
            req.FacebookUrl, req.YoutubeUrl, req.TiktokUrl, req.WebsiteUrl, req.IsPublic), ct);
        return NoContent();
    }

    [HttpPost("me/teacher-profile/image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadTeacherProfileImage(
        [FromQuery] string type,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = loc["NoFileUploaded"].Value });

        var userId = GetCurrentUserId();
        var url = await mediator.Send(
            new UploadTeacherProfileImageCommand(
                userId, type ?? "avatar",
                file.OpenReadStream(), file.FileName, file.ContentType), ct);
        return Ok(new { url });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.Identity?.Name
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedException("Invalid token.");

        return userId;
    }

    [HttpPut("me/locale")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetLocale([FromBody] SetLocaleRequest req, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await mediator.Send(new SetUserLocaleCommand(userId, req.Locale), ct);
        return NoContent();
    }
}

public record SelfUpdateTeacherProfileRequest(
    string DisplayName, string Slug, string? Headline, string? Bio,
    string? AvatarUrl, string? CoverUrl, int ExperienceYears, string? Specialization,
    string? FacebookUrl, string? YoutubeUrl, string? TiktokUrl, string? WebsiteUrl,
    bool IsPublic);

// ── Request DTOs ──────────────────────────────────────────────────────────────
public record UpdateProfileRequest(
    string FullName,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Address,
    string? CurrentLevel,
    string? Phone
);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record SetLocaleRequest(string Locale);
