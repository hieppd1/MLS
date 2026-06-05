using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.CMS.Packages;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/packages")]
[AuthorizeRoles("Admin", "SuperAdmin", "ContentManager", "Teacher")]
public class AdminPackagesController(IMediator mediator) : ControllerBase
{
    // ── Get packages for a course ─────────────────────────────────────────────

    [HttpGet("courses/{courseId:guid}")]
    public async Task<IActionResult> GetPackages(Guid courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCoursePackagesQuery(courseId), ct);
        return Ok(result);
    }

    // ── Get single package ────────────────────────────────────────────────────

    [HttpGet("{packageId:guid}")]
    public async Task<IActionResult> GetPackage(Guid packageId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPackageByIdQuery(packageId), ct);
        return Ok(result);
    }

    // ── Create package ────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreatePackage(
        [FromBody] CreatePackageAdminRequest req,
        CancellationToken ct)
    {
        var cmd = new CreatePackageCommand(
            req.CourseId, req.PackageType, req.Title, req.Description,
            req.OriginalPrice, req.SalePrice, req.DurationDay,
            req.Entitlements.Select(e => new PackageEntitlementInput(e.FeatureCode, e.Enabled)).ToList());

        var result = await mediator.Send(cmd, ct);
        return Ok(result);
    }

    // ── Update package ────────────────────────────────────────────────────────

    [HttpPut("{packageId:guid}")]
    public async Task<IActionResult> UpdatePackage(
        Guid packageId,
        [FromBody] UpdatePackageAdminRequest req,
        CancellationToken ct)
    {
        var cmd = new UpdatePackageCommand(
            packageId, req.Title, req.Description,
            req.OriginalPrice, req.SalePrice, req.DurationDay,
            req.Entitlements.Select(e => new PackageEntitlementInput(e.FeatureCode, e.Enabled)).ToList());

        var result = await mediator.Send(cmd, ct);
        return Ok(result);
    }

    // ── Activate / Archive ────────────────────────────────────────────────────

    [HttpPost("{packageId:guid}/activate")]
    public async Task<IActionResult> Activate(Guid packageId, CancellationToken ct)
    {
        await mediator.Send(new ActivatePackageCommand(packageId), ct);
        return NoContent();
    }

    [HttpPost("{packageId:guid}/archive")]
    public async Task<IActionResult> Archive(Guid packageId, CancellationToken ct)
    {
        await mediator.Send(new ArchivePackageCommand(packageId), ct);
        return NoContent();
    }

    // ── Admin: hide comment ───────────────────────────────────────────────────

    [HttpPost("/api/v1/admin/comments/{commentId:guid}/hide")]
    public async Task<IActionResult> HideComment(Guid commentId, CancellationToken ct)
    {
        await mediator.Send(new MLS.Application.Learning.Commands.HideCommentCommand(commentId), ct);
        return NoContent();
    }

    [HttpDelete("/api/v1/admin/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid commentId, CancellationToken ct)
    {
        // Admin delete — no ownership check
        await mediator.Send(new MLS.Application.Learning.Commands.DeleteCommentCommand(Guid.Empty, commentId, IsAdmin: true), ct);
        return NoContent();
    }

    [HttpPost("/api/v1/admin/comments/{commentId:guid}/pin")]
    public async Task<IActionResult> PinComment(Guid commentId, [FromQuery] bool pin = true, CancellationToken ct = default)
    {
        await mediator.Send(new MLS.Application.Learning.Commands.PinCommentCommand(commentId, pin), ct);
        return NoContent();
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreatePackageAdminRequest(
    Guid CourseId,
    string PackageType,
    string Title,
    string? Description,
    decimal OriginalPrice,
    decimal SalePrice,
    int DurationDay,
    List<EntitlementInput> Entitlements);

public record UpdatePackageAdminRequest(
    string Title,
    string? Description,
    decimal OriginalPrice,
    decimal SalePrice,
    int DurationDay,
    List<EntitlementInput> Entitlements);

public record EntitlementInput(string FeatureCode, bool Enabled);
