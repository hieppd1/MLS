using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Shipping.Commands;
using MLS.Application.Shipping.Queries;
using System.Security.Claims;

namespace MLS.API.Controllers;

/// <summary>
/// Endpoints for authenticated users to manage their own shipments.
/// </summary>
[ApiController]
[Route("api/v1/shipping")]
[Authorize]
public class ShippingController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST /api/v1/shipping/calculate-fee
    [HttpPost("calculate-fee")]
    [AllowAnonymous]
    public async Task<IActionResult> CalculateFee(
        [FromBody] CalculateFeeRequest req,
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new CalculateShippingFeeQuery(req.ReceiverProvinceCode, req.ReceiverDistrictCode, req.Weight), ct);
        return Ok(result);
    }

    // POST /api/v1/shipping/create
    [HttpPost("create")]
    public async Task<IActionResult> CreateShipment(
        [FromBody] CreateShipmentBody req,
        CancellationToken ct)
    {
        var result = await mediator.Send(new CreateShipmentCommand(
            req.OrderId,
            req.ReceiverName,
            req.ReceiverPhone,
            req.ReceiverAddress,
            req.ProvinceCode,
            req.DistrictCode,
            req.WardCode,
            req.Weight,
            req.Note), ct);

        return Ok(result);
    }

    // GET /api/v1/shipping/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShipment(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetShipmentQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // GET /api/v1/shipping/by-order/{orderId}
    [HttpGet("by-order/{orderId:guid}")]
    public async Task<IActionResult> GetShipmentByOrder(Guid orderId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetShipmentByOrderIdQuery(orderId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // GET /api/v1/shipping/tracking/{trackingNumber}
    [HttpGet("tracking/{trackingNumber}")]
    public async Task<IActionResult> TrackShipment(string trackingNumber, CancellationToken ct)
    {
        var result = await mediator.Send(new TrackShipmentQuery(trackingNumber), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // POST /api/v1/shipping/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelShipment(Guid id, CancellationToken ct)
    {
        await mediator.Send(new CancelShipmentCommand(id), ct);
        return NoContent();
    }

    // POST /api/v1/shipping/{id}/sync
    [HttpPost("{id:guid}/sync")]
    public async Task<IActionResult> SyncShipment(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new SyncShipmentStatusCommand(id), ct);
        return Ok(result);
    }
}

public record CalculateFeeRequest(
    string ReceiverProvinceCode,
    string ReceiverDistrictCode,
    int    Weight = 500);

public record CreateShipmentBody(
    Guid   OrderId,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? ProvinceCode,
    string? DistrictCode,
    string? WardCode,
    int    Weight = 500,
    string? Note  = null);
