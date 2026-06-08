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
[Route("api/v1/quizzes")]
[Authorize]
public class QuizzesController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── List & Detail ─────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] string? quizType = null,
        [FromQuery] string? skill = null, [FromQuery] string? examMode = null,
        [FromQuery] Guid? courseId = null,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuizListQuery(page, pageSize, status, quizType, skill, examMode, courseId), ct));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDetail(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetQuizDetailQuery(id), ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/preview")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPreview(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetQuizPreviewQuery(id), ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/analytics")]
    public async Task<IActionResult> GetAnalytics(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetQuizAnalyticsQuery(id), ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLeaderboard(
        [FromQuery] string period = "week",
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
        => Ok(await mediator.Send(new GetQuizLeaderboardQuery(period, limit), ct));

    // ── CRUD ──────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuizCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd with { CreatedBy = CurrentUserId }, ct);
        return CreatedAtAction(nameof(GetDetail), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateQuizCommand cmd, CancellationToken ct)
    {
        var ok = await mediator.Send(cmd with { QuizId = id }, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteQuizCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new PublishQuizCommand(id), ct);
        return ok ? Ok(new { message = loc["QuizPublished"].Value }) : NotFound();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new ArchiveQuizCommand(id), ct);
        return ok ? Ok(new { message = loc["QuizArchived"].Value }) : NotFound();
    }

    // ── My Attempts ───────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/my-attempts")]
    public async Task<IActionResult> GetMyAttempts(Guid id, CancellationToken ct)
        => Ok(await mediator.Send(new GetMyAttemptsQuery(id, CurrentUserId), ct));

    // ── Quiz-level question management ────────────────────────────────────────

    [HttpPost("{quizId:guid}/questions")]
    public async Task<IActionResult> AddQuestion(
        Guid quizId, [FromBody] AddQuestionToQuizCommand cmd, CancellationToken ct)
    {
        var id = await mediator.Send(cmd with { QuizId = quizId }, ct);
        return Ok(new { id });
    }

    [HttpDelete("{quizId:guid}/questions/{questionId:guid}")]
    public async Task<IActionResult> RemoveQuestion(Guid quizId, Guid questionId, CancellationToken ct)
    {
        var ok = await mediator.Send(new RemoveQuestionFromQuizCommand(quizId, questionId), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("{quizId:guid}/questions/reorder")]
    public async Task<IActionResult> Reorder(
        Guid quizId, [FromBody] List<ReorderItem> items, CancellationToken ct)
    {
        await mediator.Send(new ReorderQuizQuestionsCommand(quizId, items), ct);
        return NoContent();
    }

    [HttpPut("{quizId:guid}/questions/{questionId:guid}/score")]
    public async Task<IActionResult> OverrideScore(
        Guid quizId, Guid questionId,
        [FromBody] OverrideScoreRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new OverrideQuestionScoreCommand(quizId, questionId, req.Score), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── Start attempt from quiz ───────────────────────────────────────────────

    [HttpPost("{id:guid}/start")]
    public async Task<IActionResult> StartAttempt(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(new StartAttemptCommand(id, CurrentUserId), ct);
            return Ok(result);
        }
        catch (TestQuotaExceededException ex)
        {
            return StatusCode(429, new
            {
                code    = "TEST_QUOTA_EXCEEDED",
                message = ex.Message,
                quota   = ex.Quota,
                used    = ex.Used,
                isMonthly = ex.IsMonthly,
                resetDate = ex.ResetDate?.ToString("yyyy-MM-dd"),
            });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // ── Test quota for quiz ───────────────────────────────────────────────────

    [HttpGet("{id:guid}/quota")]
    public async Task<IActionResult> GetTestQuota(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTestQuotaQuery(id, CurrentUserId), ct);
        return Ok(result);
    }
}

public record OverrideScoreRequest(decimal Score);
