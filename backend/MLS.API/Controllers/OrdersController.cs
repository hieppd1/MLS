using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Orders.Commands;
using MLS.Application.Orders.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // GET /api/v1/orders
    [HttpGet]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetMyOrdersQuery(CurrentUserId, page, pageSize), ct);
        return Ok(result);
    }

    // GET /api/v1/orders/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id, CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetOrderByIdQuery(id, CurrentUserId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // GET /api/v1/orders/code/{orderCode}  — used by VNPay return page polling
    [HttpGet("code/{orderCode}")]
    public async Task<IActionResult> GetOrderByCode(string orderCode, CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetOrderByCodeQuery(orderCode, CurrentUserId), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    // DELETE /api/v1/orders/{id}/cancel
    [HttpDelete("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, CancellationToken ct = default)
    {
        try
        {
            await mediator.Send(new CancelOrderCommand(id, CurrentUserId), ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    // POST /api/v1/orders/{id}/confirm-payment  (admin / bank-transfer confirmation)
    [HttpPost("{id:guid}/confirm-payment")]
    public async Task<IActionResult> ConfirmPayment(
        Guid id,
        [FromBody] ConfirmPaymentRequest? request = null,
        CancellationToken ct = default)
    {
        var ok = await mediator.Send(new ConfirmOrderPaymentCommand(id, request?.Note), ct);
        if (!ok) return NotFound(new { message = loc["PaymentCannotConfirm"].Value });
        return Ok(new { message = loc["PaymentConfirmed"].Value });
    }
}

public record ConfirmPaymentRequest(string? Note);
