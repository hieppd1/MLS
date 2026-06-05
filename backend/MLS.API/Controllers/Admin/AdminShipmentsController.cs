using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.Shipping.Commands;
using MLS.Application.Shipping.Queries;

namespace MLS.API.Controllers.Admin;

/// <summary>
/// Admin endpoints for managing shipments.
/// </summary>
[ApiController]
[Route("api/v1/admin/shipments")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminShipmentsController(IMediator mediator) : ControllerBase
{
    // GET /api/v1/admin/shipments
    [HttpGet]
    public async Task<IActionResult> GetShipments(
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? status   = null,
        [FromQuery] string? search   = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAdminShipmentsQuery(page, pageSize, status, search), ct);
        return Ok(result);
    }

    // GET /api/v1/admin/shipments/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShipment(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetShipmentQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // POST /api/v1/admin/shipments/{id}/sync
    [HttpPost("{id:guid}/sync")]
    public async Task<IActionResult> SyncShipment(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new SyncShipmentStatusCommand(id), ct);
        return Ok(result);
    }

    // POST /api/v1/admin/shipments/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelShipment(Guid id, CancellationToken ct)
    {
        await mediator.Send(new CancelShipmentCommand(id), ct);
        return NoContent();
    }
}
