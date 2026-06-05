using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Quiz.Commands;
using MLS.Application.Quiz.Queries;
using MLS.Application.Quiz.Services;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/placement")]
public class PlacementController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Get the active placement quiz ─────────────────────────────────────────

    [HttpGet("quiz")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlacementQuiz(CancellationToken ct)
    {
        var result = await mediator.Send(new GetPlacementQuizQuery(), ct);
        return result == null ? NotFound(new { message = loc["PlacementQuizNotFound"].Value }) : Ok(result);
    }

    // ── Start a placement attempt ─────────────────────────────────────────────

    [HttpPost("start")]
    [Authorize]
    public async Task<IActionResult> Start([FromBody] StartPlacementRequest req, CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(new StartAttemptCommand(req.QuizId, CurrentUserId), ct);
            return Ok(result);
        }
        catch (TestQuotaExceededException ex)
        {
            return StatusCode(429, new
            {
                code      = "TEST_QUOTA_EXCEEDED",
                message   = ex.Message,
                quota     = ex.Quota,
                used      = ex.Used,
                isMonthly = ex.IsMonthly,
                resetDate = ex.ResetDate?.ToString("yyyy-MM-dd"),
            });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // ── Save result after submitting ──────────────────────────────────────────

    [HttpPost("result")]
    [Authorize]
    public async Task<IActionResult> SaveResult([FromBody] SavePlacementResultCommand cmd, CancellationToken ct)
    {
        var result = await mediator.Send(cmd with { UserId = CurrentUserId }, ct);
        return Ok(result);
    }

    // ── My placement result ───────────────────────────────────────────────────

    [HttpGet("my-result")]
    [Authorize]
    public async Task<IActionResult> GetMyResult(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyPlacementResultQuery(CurrentUserId), ct);
        return result == null ? NotFound() : Ok(result);
    }

    // ── Recommended courses ───────────────────────────────────────────────────

    [HttpGet("recommended-courses")]
    [Authorize]
    public async Task<IActionResult> GetRecommendedCourses(
        [FromQuery] int take = 6, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetRecommendedCoursesQuery(CurrentUserId, take), ct));
}

public record StartPlacementRequest(Guid QuizId);
