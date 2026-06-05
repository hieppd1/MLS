using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Invoice.Commands;

// ── DTO ───────────────────────────────────────────────────────────────────────

public record InvoiceDto(
    Guid    Id,
    Guid    OrderId,
    string  InvoiceNumber,
    DateTime IssuedAt,
    string? BuyerName,
    string? BuyerEmail,
    string? BuyerPhone,
    string? BuyerAddress,
    string? BuyerTaxCode,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    decimal VatAmount,
    string? Notes,
    string? PdfUrl
);

// ── Command ───────────────────────────────────────────────────────────────────

/// <summary>
/// Idempotent: if invoice already exists for the order, returns it.
/// Otherwise creates + returns new invoice.
/// </summary>
public record GenerateInvoiceCommand(
    Guid   OrderId,
    Guid   RequestingUserId,
    bool   IsAdmin = false,
    string? BuyerTaxCode = null,
    string? Notes = null
) : IRequest<InvoiceDto>;

// ── Handler ───────────────────────────────────────────────────────────────────

public class GenerateInvoiceCommandHandler(IApplicationDbContext db)
    : IRequestHandler<GenerateInvoiceCommand, InvoiceDto>
{
    public async Task<InvoiceDto> Handle(GenerateInvoiceCommand request, CancellationToken ct)
    {
        // Load order with items
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new KeyNotFoundException("Order not found.");

        // Security: non-admin can only get their own invoice
        if (!request.IsAdmin && order.UserId != request.RequestingUserId)
            throw new UnauthorizedAccessException();

        // Must be paid
        if (order.PaymentStatus != PaymentStatus.Paid)
            throw new InvalidOperationException("Invoice can only be generated for paid orders.");

        // Idempotent — return existing invoice if already generated
        var existing = await db.Invoices.FirstOrDefaultAsync(i => i.OrderId == request.OrderId, ct);
        if (existing is not null)
            return ToDto(existing);

        // Load buyer info from user profile
        var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == order.UserId, ct);
        var user    = await db.Users.FirstOrDefaultAsync(u => u.Id == order.UserId, ct);

        string invoiceNumber = GenerateInvoiceNumber();

        var invoice = MLS.Domain.Entities.Invoice.Create(
            orderId:        order.Id,
            invoiceNumber:  invoiceNumber,
            totalAmount:    order.TotalAmount,
            finalAmount:    order.FinalAmount,
            discountAmount: order.DiscountAmount,
            vatAmount:      0,
            buyerName:      profile?.FullName ?? user?.Email,
            buyerEmail:     user?.Email,
            buyerPhone:     user?.Phone,
            buyerAddress:   profile?.Address,
            buyerTaxCode:   request.BuyerTaxCode,
            notes:          request.Notes);

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync(ct);

        return ToDto(invoice);
    }

    private static string GenerateInvoiceNumber()
    {
        var now = DateTime.UtcNow;
        return $"INV{now:yyyyMM}{now.Ticks % 100000:D5}";
    }

    private static InvoiceDto ToDto(MLS.Domain.Entities.Invoice i) => new(
        i.Id, i.OrderId, i.InvoiceNumber, i.IssuedAt,
        i.BuyerName, i.BuyerEmail, i.BuyerPhone, i.BuyerAddress, i.BuyerTaxCode,
        i.TotalAmount, i.DiscountAmount, i.FinalAmount, i.VatAmount,
        i.Notes, i.PdfUrl);
}
