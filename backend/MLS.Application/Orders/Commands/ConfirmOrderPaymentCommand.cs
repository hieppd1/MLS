using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Application.Orders.Events;

namespace MLS.Application.Orders.Commands;

public record ConfirmOrderPaymentCommand(Guid OrderId, string? Note = null) : IRequest<bool>;

public class ConfirmOrderPaymentCommandHandler(IApplicationDbContext db, IMediator mediator)
    : IRequestHandler<ConfirmOrderPaymentCommand, bool>
{
    public async Task<bool> Handle(ConfirmOrderPaymentCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order is null) return false;
        if (order.Status is not (OrderStatus.Pending or OrderStatus.WaitingPayment)) return false;

        order.MarkPaid(request.Note);
        await db.SaveChangesAsync(ct);

        // Publish domain event → GrantEbookEntitlementsHandler + GenerateActivationCodesHandler
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
