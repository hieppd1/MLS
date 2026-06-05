using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Learning.Commands;
using MLS.Application.Learning.Queries;
using MLS.Application.Quiz.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/sessions")]
public class SessionsController(IMediator mediator) : ControllerBase
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

    // ── Get video-trigger quiz for session ────────────────────────────────────

    [HttpGet("{id:guid}/video-quiz")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVideoQuiz(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetVideoQuizBySessionQuery(id), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // ── Get session details with progress ─────────────────────────────────────

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSession(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionForLearningQuery(id, CurrentUserId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // ── Start session (create progress) ──────────────────────────────────────

    [HttpPost("{id:guid}/start")]
    [Authorize]
    public async Task<IActionResult> StartSession(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        var result = await mediator.Send(new StartSessionCommand(userId, id), ct);
        return Ok(result);
    }

    // ── Save video position (resume) ──────────────────────────────────────────

    [HttpPost("{id:guid}/video-position")]
    [Authorize]
    public async Task<IActionResult> SaveVideoPosition(
        Guid id,
        [FromBody] SessionVideoPositionRequest req,
        CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        await mediator.Send(new UpdateSessionVideoPositionCommand(
            userId, id, req.LastPositionSeconds, req.WatchedSeconds, req.WatchPercentage), ct);
        return NoContent();
    }

    // ── Complete session ──────────────────────────────────────────────────────

    [HttpPost("{id:guid}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteSession(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        await mediator.Send(new CompleteSessionCommand(userId, id), ct);
        return NoContent();
    }
}

// ── Segments controller ────────────────────────────────────────────────────────

[ApiController]
[Route("api/v1/segments")]
[Authorize]
public class SegmentsController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(
        User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? Guid.Empty.ToString());

    [HttpPost("{id:guid}/view")]
    public async Task<IActionResult> MarkViewed(Guid id, CancellationToken ct)
    {
        await mediator.Send(new MarkSegmentViewedCommand(CurrentUserId, id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteSegment(Guid id, CancellationToken ct)
    {
        await mediator.Send(new CompleteSegmentCommand(CurrentUserId, id), ct);
        return NoContent();
    }
}

// ── Assets interaction controller ─────────────────────────────────────────────

[ApiController]
[Route("api/v1/assets")]
public class LearningAssetsController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
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

    [HttpPost("{id:guid}/interact")]
    [Authorize]
    public async Task<IActionResult> RecordInteraction(
        Guid id,
        [FromBody] InteractRequest req,
        CancellationToken ct)
    {
        await mediator.Send(new RecordAssetInteractionCommand(
            CurrentUserId!.Value, id, req.InteractionType, req.Score), ct);
        return NoContent();
    }

    // ── Quiz endpoints ────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/quiz")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQuiz(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAssetQuizQuery(id), ct);
        if (result == null) return NotFound(new { error = loc["AssetNotFoundOrNotQuiz"].Value });
        return Ok(result);
    }

    [HttpPost("{id:guid}/quiz/submit")]
    [Authorize]
    public async Task<IActionResult> SubmitQuiz(
        Guid id,
        [FromBody] SubmitQuizRequest req,
        CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        var result = await mediator.Send(new SubmitQuizCommand(userId, id, req.Answers), ct);
        return Ok(result);
    }
}

// ── Request models ────────────────────────────────────────────────────────────

public record SessionVideoPositionRequest(int LastPositionSeconds, int WatchedSeconds, double WatchPercentage);
public record InteractRequest(string InteractionType, int? Score = null);
public record SubmitQuizRequest(List<int> Answers);
