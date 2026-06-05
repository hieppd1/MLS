using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Invoice.Commands;
using MLS.Application.Invoice.Queries;
using MLS.Domain.Entities;
using MLS.Infrastructure.Invoice;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/orders/{orderId:guid}/invoice")]
[Authorize]
public class InvoiceController(IMediator mediator, IApplicationDbContext db, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    /// <summary>GET /api/v1/orders/{orderId}/invoice — get invoice metadata (creates if not exists)</summary>
    [HttpGet]
    public async Task<IActionResult> GetOrCreate(Guid orderId, CancellationToken ct)
    {
        try
        {
            var dto = await mediator.Send(
                new GenerateInvoiceCommand(orderId, CurrentUserId, IsAdmin: false), ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException)   { return NotFound(new { message = loc["OrderNotFound"].Value }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }

    /// <summary>GET /api/v1/orders/{orderId}/invoice/pdf — download PDF</summary>
    [HttpGet("pdf")]
    public async Task<IActionResult> DownloadPdf(Guid orderId, CancellationToken ct)
    {
        try
        {
            // Generate invoice metadata (idempotent)
            await mediator.Send(
                new GenerateInvoiceCommand(orderId, CurrentUserId, IsAdmin: false), ct);

            // Load order + invoice for PDF
            var order = await db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId, ct);

            if (order is null || order.UserId != CurrentUserId)
                return NotFound();

            var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.OrderId == orderId, ct);
            if (invoice is null) return NotFound();

            var bytes = GeneratePdfBytes(order, invoice);

            return File(bytes, "application/pdf",
                $"invoice-{invoice.InvoiceNumber}.pdf");
        }
        catch (KeyNotFoundException)        { return NotFound(new { message = loc["OrderNotFound"].Value }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex){ return UnprocessableEntity(new { message = ex.Message }); }
    }

    private static byte[] GeneratePdfBytes(Order order, MLS.Domain.Entities.Invoice invoice)
        => InvoiceTemplateDocument.Render(order, invoice);
}
