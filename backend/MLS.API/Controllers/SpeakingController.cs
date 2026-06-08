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
[Route("api/v1/speaking")]
[Authorize]
public class SpeakingController(IMediator mediator, ITenantContext tenant, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    /// <summary>
    /// Upload audio for a speaking question answer.
    /// Body: multipart/form-data with fields: attemptId, questionId, file, examModeTag?
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Upload(
        [FromForm] Guid attemptId,
        [FromForm] Guid questionId,
        IFormFile file,
        [FromForm] string? examModeTag,
        CancellationToken ct)
    {
        if (file.Length == 0)
            return BadRequest(new { message = loc["AudioFileEmpty"].Value });

        var allowedPrefixes = new[] { "audio/webm", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a" };
        var contentType = file.ContentType.ToLowerInvariant();
        if (!allowedPrefixes.Any(p => contentType.StartsWith(p)))
            return BadRequest(new { message = loc["AudioFormatUnsupported"].Value });

        await using var stream = file.OpenReadStream();
        var result = await mediator.Send(new UploadSpeakingCommand(
            AttemptId:   attemptId,
            QuestionId:  questionId,
            UserId:      CurrentUserId,
            TenantSlug:  tenant.TenantSlug,
            AudioStream: stream,
            FileName:    file.FileName,
            ContentType: file.ContentType,
            FileSizeBytes: file.Length,
            ExamModeTag: examModeTag), ct);

        return Ok(result);
    }

    /// <summary>
    /// Poll status of a speaking submission.
    /// </summary>
    [HttpGet("{id:guid}/status")]
    public async Task<IActionResult> GetStatus(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSpeakingStatusQuery(id, CurrentUserId), ct);
        return result == null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Get full AI grading result including transcript and feedback.
    /// </summary>
    [HttpGet("{id:guid}/result")]
    public async Task<IActionResult> GetResult(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSpeakingResultQuery(id, CurrentUserId), ct);
        if (result == null) return NotFound();
        if (result.Status == "Pending" || result.Status == "Processing")
            return Ok(new { submissionId = id, status = result.Status, message = loc["GradingInProgress"].Value });
        return Ok(result);
    }
}
