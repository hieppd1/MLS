using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MLS.Application.Chat.Commands;
using MLS.Application.Chat.Queries;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/chat-groups/{groupId:guid}/messages")]
[Authorize]
public class ChatMessagesController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> List(
        Guid groupId,
        [FromQuery] string? cursor,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        try
        {
            var page = await mediator.Send(
                new GetChatMessagesQuery(groupId, CurrentUserId, cursor, limit), ct);
            return Ok(page);
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    public record AttachmentDto(string FileUrl, string FileName, string? MimeType, long SizeBytes, int? Width, int? Height);
    public record SendMessageRequest(
        ChatMessageType Type,
        string? Content,
        Guid? ReplyToId,
        IReadOnlyList<AttachmentDto>? Attachments
    );

    [HttpPost]
    [EnableRateLimiting("chat-send")]
    public async Task<IActionResult> Send(Guid groupId, [FromBody] SendMessageRequest body, CancellationToken ct = default)
    {
        try
        {
            var atts = body.Attachments?
                .Select(a => new AttachmentInput(a.FileUrl, a.FileName, a.MimeType, a.SizeBytes, a.Width, a.Height))
                .ToList();
            var id = await mediator.Send(new SendChatMessageCommand(
                groupId, CurrentUserId, body.Type, body.Content, body.ReplyToId, atts), ct);
            return Ok(new { id });
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpDelete("{messageId:guid}")]
    public async Task<IActionResult> Delete(Guid groupId, Guid messageId, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new DeleteChatMessageCommand(groupId, messageId, CurrentUserId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    public record MarkReadRequest(Guid LastMessageId);

    [HttpPost("read")]
    public async Task<IActionResult> MarkRead(Guid groupId, [FromBody] MarkReadRequest body, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new MarkChatReadCommand(groupId, CurrentUserId, body.LastMessageId), ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }
}
