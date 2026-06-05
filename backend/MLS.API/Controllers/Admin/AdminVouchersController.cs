using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.Admin.Vouchers;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/vouchers")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminVouchersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetVouchers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminVouchersQuery(page, pageSize, search, status), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetVoucher(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminVoucherDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateVoucher([FromBody] VoucherUpsertRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateVoucherCommand(
            req.Code!, req.Type, req.Value, req.Description,
            req.MinOrderAmount, req.MaxDiscountAmount, req.UsageLimit,
            req.StartsAt, req.ExpiresAt, req.IsPublic), ct);
        return CreatedAtAction(nameof(GetVoucher), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateVoucher(Guid id, [FromBody] VoucherUpsertRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new UpdateVoucherCommand(
            id, req.Description, req.Type, req.Value,
            req.MinOrderAmount, req.MaxDiscountAmount, req.UsageLimit,
            req.StartsAt, req.ExpiresAt, req.IsPublic), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteVoucher(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteVoucherCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleStatusRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new ToggleVoucherStatusCommand(id, req.Activate), ct);
        return ok ? NoContent() : NotFound();
    }

    // Public-facing validate (for checkout page)
    [HttpGet("validate")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal orderAmount, CancellationToken ct)
    {
        var result = await mediator.Send(new ValidateVoucherQuery(code, orderAmount), ct);
        return Ok(result);
    }
}

public record VoucherUpsertRequest(
    string? Code,
    string Type,
    decimal Value,
    string? Description,
    decimal? MinOrderAmount,
    decimal? MaxDiscountAmount,
    int? UsageLimit,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    bool IsPublic = true
);

public record ToggleStatusRequest(bool Activate);
