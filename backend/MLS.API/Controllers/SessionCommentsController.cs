using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MLS.Application.Learning.Commands;
using MLS.Application.Learning.Queries;
using MLS.Infrastructure.Hubs;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/sessions/{sessionId:guid}/comments")]
public class SessionCommentsController(IMediator mediator, IHubContext<VideoCommentHub> hub) : ControllerBase
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

    // ── List comments ─────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetComments(
        Guid sessionId,
        [FromQuery] Guid? cursor,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetSessionCommentsQuery(sessionId, CurrentUserId, cursor, pageSize), ct);
        return Ok(result);
    }

    // ── Post a comment ────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateComment(
        Guid sessionId,
        [FromBody] CreateCommentRequest req,
        CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();

        var dto = await mediator.Send(
            new CreateCommentCommand(userId, sessionId, req.SegmentId, req.Content, req.TimestampSecond, req.ParentCommentId), ct);

        // Broadcast to all clients watching this session
        await hub.Clients.Group($"session_{sessionId}").SendAsync("CommentAdded", dto, ct);

        return Ok(dto);
    }

    // ── Update comment ────────────────────────────────────────────────────────

    [HttpPut("{commentId:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateComment(
        Guid commentId,
        [FromBody] UpdateCommentRequest req,
        CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        var dto = await mediator.Send(new UpdateCommentCommand(userId, commentId, req.Content), ct);
        return Ok(dto);
    }

    // ── Delete comment ────────────────────────────────────────────────────────

    [HttpDelete("{commentId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteComment(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        await mediator.Send(new DeleteCommentCommand(userId, commentId), ct);
        return NoContent();
    }

    // ── Toggle like ───────────────────────────────────────────────────────────

    [HttpPost("{commentId:guid}/like")]
    [Authorize]
    public async Task<IActionResult> ToggleLike(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        var likeCount = await mediator.Send(new ToggleLikeCommand(userId, commentId), ct);
        return Ok(new { likeCount });
    }

    // ── Report comment ────────────────────────────────────────────────────────

    [HttpPost("{commentId:guid}/report")]
    [Authorize]
    public async Task<IActionResult> ReportComment(Guid commentId, CancellationToken ct = default)
    {
        if (CurrentUserId is not { } userId) return Unauthorized();
        await mediator.Send(new ReportCommentCommand(userId, commentId), ct);
        return NoContent();
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreateCommentRequest(
    string Content,
    int TimestampSecond = 0,
    Guid? SegmentId = null,
    Guid? ParentCommentId = null);

public record UpdateCommentRequest(string Content);
