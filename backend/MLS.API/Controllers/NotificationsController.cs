using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Notifications.Commands;
using MLS.Application.Notifications.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetNotificationsQuery(CurrentUserId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct = default)
    {
        var count = await mediator.Send(new GetUnreadCountQuery(CurrentUserId), ct);
        return Ok(new { count });
    }

    public record MarkReadRequest(IReadOnlyList<Guid>? Ids, bool All = false);

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkReadRequest body, CancellationToken ct = default)
    {
        await mediator.Send(new MarkNotificationsReadCommand(CurrentUserId, body.Ids, body.All), ct);
        return NoContent();
    }
}
