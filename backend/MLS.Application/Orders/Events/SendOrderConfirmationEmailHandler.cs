using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Interfaces;

namespace MLS.Application.Orders.Events;

public class SendOrderConfirmationEmailHandler(
    IApplicationDbContext db,
    IEmailService emailService) : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == notification.UserId, ct);

        if (user == null) return;

        var order = await db.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == notification.OrderId, ct);

        if (order == null) return;

        var displayName = user.Email;

        await emailService.SendOrderConfirmationAsync(
            user.Email,
            displayName,
            notification.OrderCode,
            order.FinalAmount,
            ct);
    }
}
