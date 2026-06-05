using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Chat.Commands;
using MLS.Application.Chat.Queries;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/support/conversations")]
[Authorize]
public class SupportConversationsController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    private bool IsSupportAgent =>
        User.IsInRole("Admin") || User.IsInRole("SuperAdmin") || User.IsInRole("Support");

    // ── Student: open / reuse conversation ───────────────────────────────────
    [HttpPost("mine/open")]
    public async Task<IActionResult> OpenMine(CancellationToken ct)
    {
        var id = await mediator.Send(new OpenSupportConversationCommand(CurrentUserId), ct);
        return Ok(new { id });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        try
        {
            var conv = await mediator.Send(new GetSupportConversationQuery(id, CurrentUserId, IsSupportAgent), ct);
            return Ok(conv);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> Messages(Guid id, [FromQuery] int limit = 100, CancellationToken ct = default)
    {
        try
        {
            var items = await mediator.Send(new GetSupportMessagesQuery(id, CurrentUserId, IsSupportAgent, limit), ct);
            return Ok(items);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    public record SendSupportMessageRequest(
        ChatMessageType Type,
        string? Content,
        string? FileUrl, string? FileName, string? MimeType, long? SizeBytes);

    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> Send(Guid id, [FromBody] SendSupportMessageRequest body, CancellationToken ct)
    {
        try
        {
            var role = IsSupportAgent ? SupportSenderRole.Support : SupportSenderRole.Student;
            var msgId = await mediator.Send(new SendSupportMessageCommand(
                id, CurrentUserId, role, body.Type, body.Content,
                body.FileUrl, body.FileName, body.MimeType, body.SizeBytes), ct);
            return Ok(new { id = msgId });
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, CancellationToken ct)
    {
        try
        {
            await mediator.Send(new CloseSupportConversationCommand(id, CurrentUserId, IsSupportAgent), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    // ── Agent: inbox + assign ────────────────────────────────────────────────
    [HttpGet("inbox")]
    [Authorize(Roles = "Admin,SuperAdmin,Support")]
    public async Task<IActionResult> Inbox(
        [FromQuery] SupportConversationStatus? status,
        [FromQuery] Guid? assignedTo,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var items = await mediator.Send(new GetSupportInboxQuery(status, assignedTo, page, pageSize), ct);
        return Ok(items);
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = "Admin,SuperAdmin,Support")]
    public async Task<IActionResult> Assign(Guid id, CancellationToken ct)
    {
        try
        {
            await mediator.Send(new AssignSupportConversationCommand(id, CurrentUserId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }
}
