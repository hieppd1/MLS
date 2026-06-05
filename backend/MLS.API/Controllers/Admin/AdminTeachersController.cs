using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Admin.Teachers;
using MLS.API.Filters;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/teachers")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminTeachersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTeachers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminTeacherListQuery(page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetTeacher(Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminTeacherDetailQuery(userId), ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut("{userId:guid}")]
    public async Task<IActionResult> UpdateTeacherProfile(
        Guid userId,
        [FromBody] UpdateTeacherProfileRequest req,
        CancellationToken ct)
    {
        await mediator.Send(new UpdateTeacherProfileCommand(
            userId,
            req.DisplayName,
            req.Slug,
            req.AvatarUrl,
            req.CoverUrl,
            req.Headline,
            req.Bio,
            req.ExperienceYears,
            req.Specialization,
            req.FacebookUrl,
            req.YoutubeUrl,
            req.TiktokUrl,
            req.WebsiteUrl,
            req.IsPublic), ct);
        return NoContent();
    }

    [HttpPut("{userId:guid}/verified")]
    public async Task<IActionResult> SetVerified(
        Guid userId,
        [FromBody] SetVerifiedRequest req,
        CancellationToken ct)
    {
        await mediator.Send(new ToggleTeacherVerifiedCommand(userId, req.IsVerified), ct);
        return NoContent();
    }
}

public record UpdateTeacherProfileRequest(
    string DisplayName,
    string Slug,
    string? AvatarUrl,
    string? CoverUrl,
    string? Headline,
    string? Bio,
    int ExperienceYears,
    string? Specialization,
    string? FacebookUrl,
    string? YoutubeUrl,
    string? TiktokUrl,
    string? WebsiteUrl,
    bool IsPublic = true);

public record SetVerifiedRequest(bool IsVerified);
