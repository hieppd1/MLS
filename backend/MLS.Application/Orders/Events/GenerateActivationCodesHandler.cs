using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;


namespace MLS.Application.Orders.Events;

/// <summary>
/// Generates activation codes for Physical book items when an order is paid.
/// One code is generated per unit purchased.
/// </summary>
public class GenerateActivationCodesHandler(IApplicationDbContext db)
    : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        var physicalItems = notification.Items
            .Where(i => i.ItemType == OrderItemType.Book
                     && i.BookId.HasValue
                     && i.BookType is "Physical" or "Combo")
            .ToList();

        if (physicalItems.Count == 0) return;

        foreach (var item in physicalItems)
        {
            for (int i = 0; i < item.Quantity; i++)
            {
                var code = ActivationCode.Generate(
                    bookId:      item.BookId!.Value,
                    orderId:     notification.OrderId,
                    orderItemId: item.OrderItemId,
                    expiresAt:   DateTime.UtcNow.AddYears(2));
                db.ActivationCodes.Add(code);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
