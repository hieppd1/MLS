using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Quiz.Commands;
using MLS.Application.Quiz.Queries;
using MLS.Domain.Interfaces;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/writing")]
[Authorize]
public class WritingController(IMediator mediator, ITenantContext tenant, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Submit an essay for AI grading.
    /// Body: { essayText, wordCount, questionId, attemptId, taskType?, essayType?, examModeTag? }
    /// </summary>
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitWritingRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.EssayText))
            return BadRequest(new { message = loc["EssayTextRequired"].Value });

        if (body.WordCount < 1)
            return BadRequest(new { message = loc["WordCountPositive"].Value });

        var result = await mediator.Send(new SubmitWritingCommand(
            AttemptId:  body.AttemptId,
            QuestionId: body.QuestionId,
            UserId:     CurrentUserId,
            TenantSlug: tenant.TenantSlug,
            EssayText:  body.EssayText,
            WordCount:  body.WordCount,
            TaskType:   body.TaskType,
            EssayType:  body.EssayType,
            ExamModeTag: body.ExamModeTag), ct);

        return Ok(result);
    }

    /// <summary>
    /// Poll status of a writing submission.
    /// </summary>
    [HttpGet("{id:guid}/status")]
    public async Task<IActionResult> GetStatus(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetWritingStatusQuery(id, CurrentUserId), ct);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Get full AI grading result including rubric scores and LLM feedback.
    /// </summary>
    [HttpGet("{id:guid}/result")]
    public async Task<IActionResult> GetResult(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetWritingResultQuery(id, CurrentUserId), ct);
        if (result == null) return NotFound();
        if (result.Status == "Pending" || result.Status == "Processing")
            return Ok(new { submissionId = id, status = result.Status, message = loc["GradingInProgress"].Value });
        return Ok(result);
    }
}

public record SubmitWritingRequest(
    Guid   AttemptId,
    Guid   QuestionId,
    string EssayText,
    int    WordCount,
    string? TaskType    = null,
    string? EssayType   = null,
    string? ExamModeTag = null);
