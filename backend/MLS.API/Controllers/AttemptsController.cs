using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Quiz.Commands;
using MLS.Application.Quiz.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/attempts")]
[Authorize]
public class AttemptsController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Answer ────────────────────────────────────────────────────────────────

    [HttpPut("{id:guid}/answer")]
    public async Task<IActionResult> SaveAnswer(
        Guid id, [FromBody] SaveAnswerCommand cmd, CancellationToken ct)
    {
        var result = await mediator.Send(cmd with { AttemptId = id }, ct);
        return result.Success
            ? Ok(result)
            : BadRequest(new { message = loc["AttemptNotFoundOrNotInProgress"].Value });
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(
        Guid id, [FromBody] SubmitRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new SubmitAttemptCommand(id, req.TimeTaken), ct);
        return Ok(result);
    }

    // ── Abandon ───────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/abandon")]
    public async Task<IActionResult> Abandon(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new AbandonAttemptCommand(id), ct);
        return ok ? Ok(new { message = loc["AttemptAbandoned"].Value }) : BadRequest();
    }

    // ── Result ────────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/result")]
    public async Task<IActionResult> GetResult(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAttemptResultQuery(id, CurrentUserId), ct);
        return result == null ? NotFound() : Ok(result);
    }
}

public record SubmitRequest(int TimeTaken);
