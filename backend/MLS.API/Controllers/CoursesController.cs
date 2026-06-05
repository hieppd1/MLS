using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Admin.Analytics;
using MLS.Application.CMS.Courses.Queries;
using MLS.Application.Learning.Commands;
using MLS.Application.Learning.Queries;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.API.Controllers;

/// <summary>
/// Public course catalog + lesson viewing (user-facing).
/// Auth optional for catalog; required for lesson access.
/// </summary>
[ApiController]
[Route("api/v1/courses")]
public class CoursesController(IMediator mediator, ITenantContext tenantContext, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var val = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return val != null ? Guid.Parse(val) : null;
        }
    }

    // ── Catalog ───────────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] int? level = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetPublicCoursesQuery(page, pageSize, level, search, CurrentUserId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourse(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPublicCourseDetailQuery(id, CurrentUserId), ct);
        if (result == null) return NotFound();
        // Record view (best-effort, don't fail request)
        _ = mediator.Send(new RecordContentViewCommand(ContentViewType.Course, id, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Learning levels (public, for filter tabs) ─────────────────────────────

    [HttpGet("learning-levels")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLearningLevels(CancellationToken ct)
        => Ok(await mediator.Send(new GetLearningLevelsQuery(IncludeInactive: false), ct));

    // ── Enrollment (free) ─────────────────────────────────────────────────────

    [HttpPost("{id:guid}/enroll")]
    [Authorize]
    public async Task<IActionResult> Enroll(Guid id, CancellationToken ct)
    {
        await mediator.Send(new EnrollCourseCommand(id, CurrentUserId!.Value, "Free"), ct);
        return Ok(new { message = loc["EnrolledSuccess"].Value });
    }

    // ── Session access ────────────────────────────────────────────────────────

    [HttpGet("sessions/{sessionId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSession(Guid sessionId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionForLearningQuery(sessionId, CurrentUserId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("sessions/{sessionId:guid}/start")]
    [Authorize]
    public async Task<IActionResult> StartSession(Guid sessionId, CancellationToken ct)
    {
        await mediator.Send(new StartSessionCommand(CurrentUserId!.Value, sessionId), ct);
        return Ok();
    }

    [HttpPost("sessions/{sessionId:guid}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteSession(
        Guid sessionId,
        [FromBody] CompleteSessionRequest? body,
        CancellationToken ct)
    {
        await mediator.Send(new CompleteSessionCommand(CurrentUserId!.Value, sessionId), ct);
        return Ok();
    }

    [HttpPost("sessions/{sessionId:guid}/video-position")]
    [Authorize]
    public async Task<IActionResult> SaveVideoPosition(Guid sessionId, [FromBody] VideoPositionRequest req, CancellationToken ct)
    {
        await mediator.Send(new SaveVideoPositionCommand(sessionId, CurrentUserId!.Value, req.PositionSeconds, req.DurationSeconds), ct);
        return Ok();
    }

    // ── User Streak ───────────────────────────────────────────────────────────

    [HttpGet("/api/v1/users/streak")]
    [Authorize]
    public async Task<IActionResult> GetLearningStreak(CancellationToken ct)
    {
        var result = await mediator.Send(new GetLearningStreakQuery(CurrentUserId!.Value), ct);
        return Ok(result);
    }
}

public record CompleteSessionRequest(int? Score);
public record VideoPositionRequest(int PositionSeconds, int DurationSeconds);
