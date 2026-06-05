using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Orders.Commands;
using MLS.Infrastructure.MultiTenancy;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/checkout")]
[Authorize]
public class CheckoutController(IMediator mediator, IConfiguration config, TenantContext tenantContext, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpPost]
    public async Task<IActionResult> CreateCheckout(
        [FromBody] CheckoutRequest request, CancellationToken ct)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest(new { message = loc["CartEmpty"].Value });

        var clientIp = (Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString()
            ?? "127.0.0.1").Split(',')[0].Trim();

        var command = new CreateCheckoutCommand(
            UserId:          CurrentUserId,
            Items:           request.Items.Select(i => new CheckoutItemDto(
                                 i.BookId, i.Title, i.Type, i.UnitPrice, i.Quantity,
                                 i.Slug, i.CoverColor, i.CoverEmoji, i.CoverUrl,
                                 i.ItemType ?? "Book", i.CourseId)).ToList(),
            PaymentMethod:   request.PaymentMethod ?? "BankTransfer",
            ShippingName:    request.ShippingName,
            ShippingPhone:   request.ShippingPhone,
            ShippingAddress: request.ShippingAddress,
            ShippingProvince: request.ShippingProvince,
            ShippingDistrict: request.ShippingDistrict,
            ShippingWard:    request.ShippingWard,
            Notes:           request.Notes,
            VoucherCode:     request.VoucherCode,
            GatewayIpnBaseUrl: config["VNPay:BaseUrl"] ?? config["Momo:IpnBaseUrl"] ?? "https://yourdomain.com",
            ClientIpAddress:   clientIp,
            TenantSlug:        tenantContext.IsResolved ? tenantContext.TenantSlug : null);

        try
        {
            var result = await mediator.Send(command, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }
}

// ── Request model ─────────────────────────────────────────────────────────────

public record CheckoutRequestItem(
    Guid?   BookId,
    string  Title,
    string  Type,
    decimal UnitPrice,
    int     Quantity,
    string? Slug,
    string? CoverColor,
    string? CoverEmoji,
    string? CoverUrl,
    // Phase 5: course items
    string? ItemType = "Book",
    Guid?   CourseId = null
);

public record CheckoutRequest(
    List<CheckoutRequestItem> Items,
    string? PaymentMethod,
    string? ShippingName,
    string? ShippingPhone,
    string? ShippingAddress,
    string? ShippingProvince,
    string? ShippingDistrict,
    string? ShippingWard,
    string? Notes,
    string? VoucherCode
);
