using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Invoice.Commands;

namespace MLS.Application.Invoice.Queries;

public record GetInvoiceByOrderQuery(
    Guid OrderId,
    Guid RequestingUserId,
    bool IsAdmin = false
) : IRequest<InvoiceDto?>;

public class GetInvoiceByOrderHandler(IApplicationDbContext db)
    : IRequestHandler<GetInvoiceByOrderQuery, InvoiceDto?>
{
    public async Task<InvoiceDto?> Handle(GetInvoiceByOrderQuery request, CancellationToken ct)
    {
        // Security: non-admin must own the order
        if (!request.IsAdmin)
        {
            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);
            if (order is null || order.UserId != request.RequestingUserId)
                return null;
        }

        var inv = await db.Invoices.FirstOrDefaultAsync(i => i.OrderId == request.OrderId, ct);
        if (inv is null) return null;

        return new InvoiceDto(
            inv.Id, inv.OrderId, inv.InvoiceNumber, inv.IssuedAt,
            inv.BuyerName, inv.BuyerEmail, inv.BuyerPhone, inv.BuyerAddress, inv.BuyerTaxCode,
            inv.TotalAmount, inv.DiscountAmount, inv.FinalAmount, inv.VatAmount,
            inv.Notes, inv.PdfUrl);
    }
}
