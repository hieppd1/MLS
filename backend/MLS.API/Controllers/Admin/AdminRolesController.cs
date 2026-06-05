using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MLS.API.Filters;
using MLS.Application.Admin.Roles.Commands;
using MLS.Application.Common.Interfaces;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/roles")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminRolesController(IApplicationDbContext db, IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await db.Roles
            .Include(r => r.UserRoles)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                r.Permissions,
                UserCount = r.UserRoles.Count
            })
            .ToListAsync(ct);

        return Ok(roles);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRole(Guid id, CancellationToken ct)
    {
        var role = await db.Roles
            .Include(r => r.UserRoles)
            .Where(r => r.Id == id)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                r.Permissions,
                UserCount = r.UserRoles.Count
            })
            .FirstOrDefaultAsync(ct);

        if (role is null) return NotFound();
        return Ok(role);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateRoleCommand(request.Name, request.Description), ct);
        return CreatedAtAction(nameof(GetRole), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdateRoleCommand(id, request.Name, request.Description), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteRoleCommand(id), ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/permissions")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePermissions(
        Guid id,
        [FromBody] UpdatePermissionsRequest request,
        CancellationToken ct)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (role is null) return NotFound();

        if (role.Name == MLS.Domain.Entities.Role.Names.SuperAdmin)
            return Forbid();

        role.SetPermissions(request.Permissions);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
public record CreateRoleRequest(string Name, string? Description);
public record UpdateRoleRequest(string Name, string? Description);
public record UpdatePermissionsRequest(string[] Permissions);
