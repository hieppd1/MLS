using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.VSTEP.Commands;
using MLS.Application.VSTEP.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/vstep")]
[Authorize]
public class VSTEPController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Sessions ──────────────────────────────────────────────────────────────

    /// <summary>Create a new VSTEP session.</summary>
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateVSTEPSessionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateVSTEPSessionCommand(CurrentUserId, req.TargetBand), ct);
        return Ok(result);
    }

    /// <summary>Get VSTEP session by ID.</summary>
    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSession(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetVSTEPSessionQuery(id, CurrentUserId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>List my VSTEP sessions.</summary>
    [HttpGet("sessions/my-history")]
    public async Task<IActionResult> MyHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMyVSTEPSessionsQuery(CurrentUserId, page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>Start a specific part (Listening/Reading/Writing/Speaking).</summary>
    [HttpPost("sessions/{id:guid}/start-part")]
    public async Task<IActionResult> StartPart(Guid id, [FromBody] StartVSTEPPartRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new StartVSTEPPartCommand(id, CurrentUserId, req.Part, req.QuizId), ct);
        return Ok(result);
    }

    /// <summary>Submit part score (Listening/Reading auto; Writing/Speaking from AI worker).</summary>
    [HttpPost("sessions/{id:guid}/submit-part")]
    public async Task<IActionResult> SubmitPart(Guid id, [FromBody] SubmitVSTEPPartRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new SubmitVSTEPPartCommand(id, CurrentUserId, req.Part, req.Score), ct);
        return Ok(result);
    }

    // ── Passages (Teacher CRUD) ───────────────────────────────────────────────

    /// <summary>Get passage groups (listening/reading) for a quiz.</summary>
    [HttpGet("quizzes/{quizId:guid}/passages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPassages(Guid quizId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPassageGroupsQuery(quizId), ct);
        return Ok(result);
    }

    /// <summary>Create a passage group for a quiz (teacher only).</summary>
    [HttpPost("quizzes/{quizId:guid}/passages")]
    public async Task<IActionResult> CreatePassage(Guid quizId, [FromBody] UpsertPassageGroupRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreatePassageGroupCommand(
            quizId, req.GroupIndex, req.PassageType, req.PassageText, req.AudioUrl,
            req.AudioPlayLimit, req.PreListenSeconds,
            req.QuestionIds ?? [], req.DisplayOrder), ct);
        return Ok(result);
    }

    /// <summary>Update a passage group (teacher only).</summary>
    [HttpPut("passages/{id:guid}")]
    public async Task<IActionResult> UpdatePassage(Guid id, [FromBody] UpsertPassageGroupRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdatePassageGroupCommand(
            id, req.PassageType, req.PassageText, req.AudioUrl,
            req.AudioPlayLimit, req.PreListenSeconds,
            req.QuestionIds ?? [], req.DisplayOrder), ct);
        return Ok(result);
    }

    /// <summary>Delete a passage group (teacher only).</summary>
    [HttpDelete("passages/{id:guid}")]
    public async Task<IActionResult> DeletePassage(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeletePassageGroupCommand(id), ct);
        return NoContent();
    }

    /// <summary>List published VSTEP quizzes by type.</summary>
    [HttpGet("quizzes/published")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublishedQuizzes(
        [FromQuery] string quizType = "VSTEPMockTest",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetPublishedVSTEPQuizzesQuery(quizType), ct);
        return Ok(result);
    }

    // ── Results ───────────────────────────────────────────────────────────────

    /// <summary>Get band result for a session.</summary>
    [HttpGet("results/{sessionId:guid}")]
    public async Task<IActionResult> GetResult(Guid sessionId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetVSTEPBandResultQuery(sessionId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Get my latest VSTEP result.</summary>
    [HttpGet("results/my-latest")]
    public async Task<IActionResult> GetMyLatestResult(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyLatestVSTEPResultQuery(CurrentUserId), ct);
        return result is null ? NotFound() : Ok(result);
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreateVSTEPSessionRequest(string? TargetBand = null);
public record StartVSTEPPartRequest(string Part, Guid QuizId);
public record SubmitVSTEPPartRequest(string Part, decimal Score);

public record UpsertPassageGroupRequest(
    int     GroupIndex,
    string  PassageType,
    string? PassageText,
    string? AudioUrl,
    int     AudioPlayLimit = 2,
    int     PreListenSeconds = 20,
    Guid[]? QuestionIds = null,
    int     DisplayOrder = 0);
