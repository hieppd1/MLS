using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Orders.Commands;

public record CancelOrderCommand(Guid OrderId, Guid UserId) : IRequest;

public class CancelOrderCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CancelOrderCommand>
{
    public async Task Handle(CancelOrderCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, ct)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Status is not (OrderStatus.Pending or OrderStatus.WaitingPayment))
            throw new InvalidOperationException("Only pending orders can be cancelled.");

        order.Cancel();
        await db.SaveChangesAsync(ct);
    }
}
