using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.QuizConfig.Commands;
using MLS.Application.QuizConfig.Queries;

namespace MLS.API.Controllers;

/// <summary>
/// Portal config API — manages quiz type categories per exam mode.
/// GET is public (used by create-quiz wizard); write endpoints require Teacher/Admin.
/// </summary>
[ApiController]
[Route("api/v1/portal/config")]
public class QuizConfigController(IMediator mediator) : ControllerBase
{
    // ── Quiz Types ─────────────────────────────────────────────────────────────

    /// <summary>GET /api/v1/portal/config/quiz-types?examMode=Standard&activeOnly=true</summary>
    [HttpGet("quiz-types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQuizTypes(
        [FromQuery] string? examMode = null,
        [FromQuery] bool activeOnly = true,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuizTypeConfigsQuery(examMode, activeOnly), ct));

    /// <summary>POST /api/v1/portal/config/quiz-types</summary>
    [HttpPost("quiz-types")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateQuizType(
        [FromBody] CreateQuizTypeConfigCommand cmd,
        CancellationToken ct)
    {
        try
        {
            var id = await mediator.Send(cmd, ct);
            return CreatedAtAction(nameof(GetQuizTypes), new { }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>PUT /api/v1/portal/config/quiz-types/{id}</summary>
    [HttpPut("quiz-types/{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> UpdateQuizType(
        Guid id,
        [FromBody] UpdateQuizTypeConfigBody body,
        CancellationToken ct)
    {
        var ok = await mediator.Send(
            new UpdateQuizTypeConfigCommand(id, body.Label, body.SortOrder, body.IsActive), ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>DELETE /api/v1/portal/config/quiz-types/{id}</summary>
    [HttpDelete("quiz-types/{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> DeleteQuizType(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteQuizTypeConfigCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }
}

public record UpdateQuizTypeConfigBody(string Label, int SortOrder, bool IsActive);
