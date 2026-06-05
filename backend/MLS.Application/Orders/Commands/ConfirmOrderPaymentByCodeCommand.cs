using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Application.Orders.Events;

namespace MLS.Application.Orders.Commands;

/// <summary>
/// Confirms payment for an order identified by OrderCode (used by payment gateway IPNs).
/// </summary>
public record ConfirmOrderPaymentByCodeCommand(string OrderCode, string? Note = null) : IRequest<bool>;

public class ConfirmOrderPaymentByCodeHandler(IApplicationDbContext db, IMediator mediator)
    : IRequestHandler<ConfirmOrderPaymentByCodeCommand, bool>
{
    public async Task<bool> Handle(ConfirmOrderPaymentByCodeCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderCode == request.OrderCode, ct);

        if (order is null) return false;
        if (order.Status is not (OrderStatus.Pending or OrderStatus.WaitingPayment)) return true; // idempotent

        order.MarkPaid(request.Note);
        await db.SaveChangesAsync(ct);

        var paidEvent = new OrderPaidEvent(
            OrderId:   order.Id,
            OrderCode: order.OrderCode,
            UserId:    order.UserId,
            Items:     order.Items.Select(i => new OrderPaidItemInfo(
                OrderItemId: i.Id,
                BookId:      i.BookId,
                BookTitle:   i.BookTitle,
                BookType:    i.BookType,
                Quantity:    i.Quantity,
                UnitPrice:   i.UnitPrice,
                ItemType:    i.ItemType,
                CourseId:    i.CourseId
            )).ToList(),
            PaidAt: order.PaidAt!.Value);

        await mediator.Publish(paidEvent, ct);
        return true;
    }
}
