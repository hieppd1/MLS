using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.QA.Commands;
using MLS.Application.QA.Queries;

namespace MLS.API.Controllers;

/// <summary>Q&amp;A comment threads for lessons. Lessons and Sessions both use this controller.</summary>
[ApiController]
[Route("api/v1/lessons/{lessonId:guid}/comments")]
public class LessonCommentsController(IMediator mediator) : ControllerBase
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

    private string CurrentUserRole =>
        User.FindFirst("role")?.Value ?? "Student";

    [HttpGet]
    public async Task<IActionResult> List(
        Guid lessonId,
        [FromQuery] Guid? cursor,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetLessonCommentsQuery(lessonId, null, CurrentUserId, cursor, Math.Clamp(limit, 1, 50)), ct);
        return Ok(result);
    }

    public record CreateCommentRequest(string Content, Guid? ParentId);

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid lessonId, [FromBody] CreateCommentRequest body, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var dto = await mediator.Send(
                new CreateLessonCommentCommand(userId, lessonId, null, body.Content, body.ParentId), ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpDelete("{commentId:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            await mediator.Send(new DeleteLessonCommentCommand(commentId, userId, CurrentUserRole), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpPost("{commentId:guid}/upvote")]
    [Authorize]
    public async Task<IActionResult> Upvote(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var upvoted = await mediator.Send(new ToggleUpvoteCommand(commentId, userId), ct);
            return Ok(new { upvoted });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{commentId:guid}/pin")]
    [Authorize]
    public async Task<IActionResult> Pin(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var pinned = await mediator.Send(new TogglePinCommand(commentId, userId, CurrentUserRole), ct);
            return Ok(new { pinned });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

/// <summary>Same as LessonCommentsController but scoped to sessions.</summary>
[ApiController]
[Route("api/v1/sessions/{sessionId:guid}/qa")]
public class SessionQaCommentsController(IMediator mediator) : ControllerBase
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

    private string CurrentUserRole =>
        User.FindFirst("role")?.Value ?? "Student";

    [HttpGet]
    public async Task<IActionResult> List(
        Guid sessionId,
        [FromQuery] Guid? cursor,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetLessonCommentsQuery(null, sessionId, CurrentUserId, cursor, Math.Clamp(limit, 1, 50)), ct);
        return Ok(result);
    }

    public record CreateCommentRequest(string Content, Guid? ParentId);

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid sessionId, [FromBody] CreateCommentRequest body, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var dto = await mediator.Send(
                new CreateLessonCommentCommand(userId, null, sessionId, body.Content, body.ParentId), ct);
            return Ok(dto);
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpDelete("{commentId:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            await mediator.Send(new DeleteLessonCommentCommand(commentId, userId, CurrentUserRole), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpPost("{commentId:guid}/upvote")]
    [Authorize]
    public async Task<IActionResult> Upvote(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var upvoted = await mediator.Send(new ToggleUpvoteCommand(commentId, userId), ct);
            return Ok(new { upvoted });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{commentId:guid}/pin")]
    [Authorize]
    public async Task<IActionResult> Pin(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        try
        {
            var pinned = await mediator.Send(new TogglePinCommand(commentId, userId, CurrentUserRole), ct);
            return Ok(new { pinned });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
