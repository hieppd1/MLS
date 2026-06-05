using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Admin.System;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Interfaces;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/system")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminSystemController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    // ── Public endpoint (no auth) for frontend banner carousel ───────────────
    [AllowAnonymous]
    [HttpGet("banners/public")]
    public async Task<IActionResult> GetPublicBanners(CancellationToken ct)
    {
        var result = await mediator.Send(new GetBannerSlidesQuery(ActiveOnly: true), ct);
        return Ok(result);
    }

    // ── Admin CRUD ────────────────────────────────────────────────────────────
    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners(CancellationToken ct)
    {
        var result = await mediator.Send(new GetBannerSlidesQuery(ActiveOnly: false), ct);
        return Ok(result);
    }

    [HttpPost("banners")]
    public async Task<IActionResult> CreateBanner([FromBody] BannerSlideRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateBannerSlideCommand(
            req.Title, req.Subtitle, req.Description,
            req.ImageUrl, req.LinkUrl, req.BadgeText,
            req.CtaText, req.BgColor, req.TextColor, req.OrderIndex), ct);
        return Ok(new { id });
    }

    [HttpPut("banners/{id:guid}")]
    public async Task<IActionResult> UpdateBanner(Guid id, [FromBody] BannerSlideRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateBannerSlideCommand(
            id, req.Title, req.Subtitle, req.Description,
            req.ImageUrl, req.LinkUrl, req.BadgeText,
            req.CtaText, req.BgColor, req.TextColor,
            req.OrderIndex, req.IsActive ?? true), ct);
        return NoContent();
    }

    [HttpDelete("banners/{id:guid}")]
    public async Task<IActionResult> DeleteBanner(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteBannerSlideCommand(id), ct);
        return NoContent();
    }

    [HttpPost("banners/upload-image")]
    [RequestFormLimits(MultipartBodyLengthLimit = 5_242_880)] // 5 MB
    public async Task<IActionResult> UploadBannerImage(
        IFormFile file,
        [FromServices] IStorageService storage,
        [FromServices] ITenantContext tenantContext,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = loc["NoFileUploaded"].Value });

        string[] allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { error = loc["ImageOnlyAllowed"].Value });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = loc["FileSizeExceeded5MB"].Value });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";
        var safeFileName = $"banner_{Guid.NewGuid():N}{ext}";

        var relativePath = await storage.UploadAsync(
            tenantContext.TenantSlug, "banners", safeFileName,
            file.OpenReadStream(), file.ContentType, ct);

        return Ok(new { url = $"/media/{relativePath}" });
    }
}

public record BannerSlideRequest(
    string Title,
    string? Subtitle = null,
    string? Description = null,
    string? ImageUrl = null,
    string? LinkUrl = null,
    string? BadgeText = null,
    string? CtaText = null,
    string? BgColor = null,
    string? TextColor = null,
    int OrderIndex = 0,
    bool? IsActive = true);
