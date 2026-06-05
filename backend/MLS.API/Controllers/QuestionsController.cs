using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Quiz.Commands;
using MLS.Application.Quiz.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/questions")]
[Authorize]
public class QuestionsController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── List & Detail ─────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30,
        [FromQuery] string? type = null, [FromQuery] string? skill = null,
        [FromQuery] string? difficulty = null, [FromQuery] string? tag = null,
        [FromQuery] string? search = null, [FromQuery] bool? isPublic = null,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuestionListQuery(
            page, pageSize, type, skill, difficulty, tag, search, null, isPublic), ct));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDetail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetQuestionDetailQuery(id), ct);
        return result == null ? NotFound() : Ok(result);
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuestionCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd with { CreatedBy = CurrentUserId }, ct);
        return CreatedAtAction(nameof(GetDetail), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateQuestionCommand cmd, CancellationToken ct)
    {
        var ok = await mediator.Send(cmd with { QuestionId = id }, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteQuestionCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── My questions (for teacher/admin) ──────────────────────────────────────

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 30,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuestionListQuery(
            page, pageSize, CreatedBy: CurrentUserId), ct));
}
