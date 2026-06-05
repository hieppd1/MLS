using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;


namespace MLS.Application.Orders.Events;

/// <summary>
/// Grants EbookEntitlements for all Ebook/Combo items when an order is paid.
/// </summary>
public class GrantEbookEntitlementsHandler(IApplicationDbContext db)
    : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        var ebookItems = notification.Items
            .Where(i => i.ItemType == OrderItemType.Book
                     && i.BookId.HasValue
                     && i.BookType is "Ebook" or "Combo")
            .ToList();

        if (ebookItems.Count == 0) return;

        foreach (var item in ebookItems)
        {
            var bookId = item.BookId!.Value;

            // Idempotent — skip if already entitled
            var exists = await db.EbookEntitlements
                .AnyAsync(e => e.UserId == notification.UserId && e.BookId == bookId, ct);

            if (!exists)
            {
                var entitlement = EbookEntitlement.Create(
                    userId: notification.UserId,
                    bookId: bookId,
                    source: EntitlementSource.Purchase);
                db.EbookEntitlements.Add(entitlement);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
