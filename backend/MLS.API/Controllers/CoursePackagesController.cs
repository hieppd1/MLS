using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.CMS.Packages;

namespace MLS.API.Controllers;

/// <summary>Student-facing course packages endpoints</summary>
[ApiController]
[Route("api/v1/courses/{courseId:guid}/packages")]
public class CoursePackagesController(IMediator mediator) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var sub = User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return sub != null && Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    // ── List active packages for course ───────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetPackages(Guid courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCoursePackagesQuery(courseId, ActiveOnly: true), ct);
        return Ok(result);
    }

    // ── Purchase a package ────────────────────────────────────────────────────

    [HttpPost("{packageId:guid}/purchase")]
    [Authorize]
    public async Task<IActionResult> Purchase(Guid courseId, Guid packageId, CancellationToken ct)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var result = await mediator.Send(new PurchasePackageCommand(userId, packageId), ct);
        return Ok(result);
    }

    // ── Check feature access ──────────────────────────────────────────────────

    [HttpGet("access/{featureCode}")]
    [Authorize]
    public async Task<IActionResult> CheckAccess(Guid courseId, string featureCode, CancellationToken ct)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var result = await mediator.Send(new CheckFeatureAccessQuery(userId, courseId, featureCode), ct);
        return Ok(result);
    }
}

/// <summary>Student's own packages</summary>
[ApiController]
[Route("api/v1/my-packages")]
[Authorize]
public class MyPackagesController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? Guid.Empty.ToString());

    [HttpGet]
    public async Task<IActionResult> GetMyPackages([FromQuery] Guid? courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyPackagesQuery(CurrentUserId, courseId), ct);
        return Ok(result);
    }
}
