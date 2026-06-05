using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Admin.Users.Commands;
using MLS.Application.Admin.Users.Queries;
using MLS.Application.Users.Commands;
using MLS.API.Filters;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/users")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminUsersController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAdminUsersQuery(page, pageSize, search, role, status), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminUserDetailQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(
            new CreateUserCommand(request.Email, request.Password, request.FullName, request.Phone, request.RoleName), ct);
        return CreatedAtAction(nameof(GetUser), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateUserCommand(id, request.FullName, request.Phone, request.DateOfBirth, request.Gender, request.Address, request.CurrentLevel), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteUserCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateUserStatusCommand(id, request.Status), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest request, CancellationToken ct)
    {
        await mediator.Send(new AssignRoleCommand(id, request.RoleName), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadUserAvatar(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = loc["NoFileUploaded"].Value });

        var relativePath = await mediator.Send(
            new UploadAvatarCommand(id, file.OpenReadStream(), file.FileName, file.ContentType), ct);
        return Ok(new { avatarUrl = relativePath });
    }

    [HttpPost("invite")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request, CancellationToken ct)
    {
        var inviterName = User.FindFirst("name")?.Value
            ?? User.FindFirst("email")?.Value
            ?? "Admin";

        await mediator.Send(
            new InviteUserCommand(request.Email, request.RoleName, inviterName, request.TenantName), ct);
        return NoContent();
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
public record CreateUserRequest(string Email, string Password, string FullName, string? Phone, string RoleName);
public record UpdateUserRequest(string FullName, string? Phone, DateOnly? DateOfBirth, string? Gender, string? Address, string? CurrentLevel);
public record UpdateStatusRequest(string Status);
public record AssignRoleRequest(string RoleName);
public record InviteUserRequest(string Email, string RoleName, string TenantName);
