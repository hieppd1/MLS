using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Chat.Commands;
using MLS.Application.Chat.Queries;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/chat-groups")]
[Authorize]
public class ChatGroupsController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Discover / Mine / Detail ─────────────────────────────────────────

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct = default)
    {
        var list = await mediator.Send(new ListMyChatGroupsQuery(CurrentUserId), ct);
        return Ok(list);
    }

    [HttpGet("discover")]
    [AllowAnonymous]
    public async Task<IActionResult> Discover(
        [FromQuery] string? search,
        [FromQuery] ChatGroupType? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        Guid? userId = User.Identity?.IsAuthenticated == true ? CurrentUserId : null;
        var list = await mediator.Send(
            new DiscoverChatGroupsQuery(userId, search, type, page, pageSize), ct);
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Detail(Guid id, CancellationToken ct = default)
    {
        var dto = await mediator.Send(new GetChatGroupDetailQuery(id, CurrentUserId), ct);
        return dto == null ? NotFound() : Ok(dto);
    }

    // ── CRUD ─────────────────────────────────────────────────────────────

    public record CreateGroupRequest(
        string Name,
        ChatGroupType Type,
        string? Description,
        string? AvatarUrl,
        int? MaxMembers,
        string? Tags
    );

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest body, CancellationToken ct = default)
    {
        try
        {
            var id = await mediator.Send(new CreateChatGroupCommand(
                CurrentUserId, body.Name, body.Type, body.Description,
                body.AvatarUrl, body.MaxMembers, body.Tags), ct);
            return CreatedAtAction(nameof(Detail), new { id }, new { id });
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    public record UpdateGroupRequest(
        string Name,
        ChatGroupType Type,
        string? Description,
        string? AvatarUrl,
        int MaxMembers,
        string? Tags
    );

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGroupRequest body, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new UpdateChatGroupCommand(
                id, CurrentUserId, body.Name, body.Type, body.Description,
                body.AvatarUrl, body.MaxMembers, body.Tags), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        try
        {
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
            await mediator.Send(new DeleteChatGroupCommand(id, CurrentUserId, isAdmin), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    // ── Membership ──────────────────────────────────────────────────────

    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> Join(Guid id, CancellationToken ct = default)
    {
        try
        {
            var status = await mediator.Send(new JoinChatGroupCommand(id, CurrentUserId), ct);
            return Ok(new { status = status.ToString() });
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new LeaveChatGroupCommand(id, CurrentUserId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/members/{memberId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, Guid memberId, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new ApproveMemberCommand(id, CurrentUserId, memberId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/members/{memberId:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, Guid memberId, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new RejectMemberCommand(id, CurrentUserId, memberId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> Remove(Guid id, Guid memberId, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new RemoveMemberCommand(id, CurrentUserId, memberId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    public record PromoteRequest(ChatGroupMemberRole Role);

    [HttpPost("{id:guid}/members/{memberId:guid}/promote")]
    public async Task<IActionResult> Promote(Guid id, Guid memberId, [FromBody] PromoteRequest body, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new PromoteMemberCommand(id, CurrentUserId, memberId, body.Role), ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }
}
