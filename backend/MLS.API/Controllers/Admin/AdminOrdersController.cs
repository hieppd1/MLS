using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.Admin.Orders;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminOrdersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? paymentMethod = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAdminOrdersQuery(page, pageSize, search, status, paymentMethod), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminOrderDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/confirm-payment")]
    public async Task<IActionResult> ConfirmPayment(Guid id, [FromBody] AdminConfirmPaymentRequest? req, CancellationToken ct)
    {
        var ok = await mediator.Send(new AdminConfirmPaymentCommand(id, req?.Note), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new AdminUpdateOrderStatusCommand(id, req.Status), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new AdminCancelOrderCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }
}

public record AdminConfirmPaymentRequest(string? Note);
public record UpdateOrderStatusRequest(string Status);
