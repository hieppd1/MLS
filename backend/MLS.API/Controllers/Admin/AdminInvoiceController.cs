using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.Invoice.Commands;
using MLS.Application.Invoice.Queries;
using MLS.Domain.Entities;
using MLS.Infrastructure.Invoice;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders/{orderId:guid}/invoice")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminInvoiceController(IMediator mediator, IApplicationDbContext db) : ControllerBase
{
    /// <summary>GET — get or create invoice for any order</summary>
    [HttpGet]
    public async Task<IActionResult> GetOrCreate(Guid orderId, CancellationToken ct)
    {
        try
        {
            var dto = await mediator.Send(
                new GenerateInvoiceCommand(orderId, Guid.Empty, IsAdmin: true), ct);
            return Ok(dto);
        }
        catch (KeyNotFoundException)        { return NotFound(); }
        catch (InvalidOperationException ex){ return UnprocessableEntity(new { message = ex.Message }); }
    }

    /// <summary>GET /pdf — download PDF for any order</summary>
    [HttpGet("pdf")]
    public async Task<IActionResult> DownloadPdf(Guid orderId, CancellationToken ct)
    {
        try
        {
            await mediator.Send(
                new GenerateInvoiceCommand(orderId, Guid.Empty, IsAdmin: true), ct);

            var order = await db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId, ct);

            if (order is null) return NotFound();

            var invoice = await db.Invoices.FirstOrDefaultAsync(i => i.OrderId == orderId, ct);
            if (invoice is null) return NotFound();

            var bytes = InvoiceTemplateDocument.Render(order, invoice);

            return File(bytes, "application/pdf",
                $"invoice-{invoice.InvoiceNumber}.pdf");
        }
        catch (KeyNotFoundException)        { return NotFound(); }
        catch (InvalidOperationException ex){ return UnprocessableEntity(new { message = ex.Message }); }
    }
}
