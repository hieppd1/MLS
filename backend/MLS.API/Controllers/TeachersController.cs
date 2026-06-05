using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Admin.Analytics;
using MLS.Application.Teacher.Queries;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/teachers")]
public class TeachersController(IMediator mediator) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var val = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return val != null ? Guid.Parse(val) : null;
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetTeacherListQuery(page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTeacherBySlugQuery(slug, CurrentUserId), ct);
        if (result == null) return NotFound();
        _ = mediator.Send(new RecordContentViewCommand(ContentViewType.Teacher, result.Id, CurrentUserId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/courses")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourses(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTeacherCoursesQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/follow")]
    [Authorize]
    public async Task<IActionResult> Follow(Guid id, CancellationToken ct)
    {
        if (CurrentUserId == null) return Unauthorized();
        var ok = await mediator.Send(new FollowTeacherCommand(id, CurrentUserId.Value), ct);
        return ok ? Ok() : Conflict("Already following");
    }

    [HttpDelete("{id:guid}/follow")]
    [Authorize]
    public async Task<IActionResult> Unfollow(Guid id, CancellationToken ct)
    {
        if (CurrentUserId == null) return Unauthorized();
        var ok = await mediator.Send(new UnfollowTeacherCommand(id, CurrentUserId.Value), ct);
        return ok ? Ok() : NotFound("Not following");
    }
}
