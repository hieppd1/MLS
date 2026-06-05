using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MLS.Application.Common.Interfaces;
using MLS.Application.Shipping.Commands;
using MLS.Domain.Entities;

namespace MLS.Application.Orders.Events;

/// <summary>
/// Handles OrderPaidEvent — automatically creates a ViettelPost shipment
/// for orders that contain Physical books.
/// </summary>
public class CreateShipmentOnOrderPaidHandler(
    IApplicationDbContext db,
    IShippingProvider     shipping,
    ILogger<CreateShipmentOnOrderPaidHandler> logger)
    : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        // Only trigger for orders that have physical-book items
        var hasPhysical = notification.Items.Any(i =>
            i.ItemType == OrderItemType.Book &&
            i.BookId.HasValue);

        if (!hasPhysical)
        {
            logger.LogDebug("Order {OrderId} has no physical items — skipping shipment creation.", notification.OrderId);
            return;
        }

        // Get order with shipping address
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == notification.OrderId, ct);

        if (order == null)
        {
            logger.LogWarning("Order {OrderId} not found for shipment creation.", notification.OrderId);
            return;
        }

        var addr = order.GetShipping();
        if (addr == null)
        {
            logger.LogWarning("Order {OrderId} has no shipping address — skipping.", notification.OrderId);
            return;
        }

        // Prevent duplicate shipment
        var already = await db.Shipments.AnyAsync(s => s.OrderId == notification.OrderId, ct);
        if (already)
        {
            logger.LogDebug("Shipment already exists for order {OrderId}.", notification.OrderId);
            return;
        }

        // Estimate total weight (500g per physical book item)
        var physicalQty = notification.Items
            .Where(i => i.ItemType == OrderItemType.Book && i.BookId.HasValue)
            .Sum(i => i.Quantity);
        var weight = physicalQty * 500;

        // Calculate fee
        var feeResult = await shipping.CalculateFeeAsync(
            new CalculateFeeRequest("HCM", "001", addr.Province ?? "HCM", addr.District ?? "001", weight), ct);

        var fee = feeResult.Success ? feeResult.Fee : 0m;

        // Create shipment entity
        var shipment = Shipment.Create(
            notification.OrderId,
            addr.Name,
            addr.Phone,
            $"{addr.Address}, {addr.Ward}, {addr.District}, {addr.Province}",
            addr.Province,
            addr.District,
            addr.Ward,
            fee);

        db.Shipments.Add(shipment);

        // Try to create on provider
        try
        {
            var req = new CreateShipmentRequest(
                OrderCode:            notification.OrderCode,
                SenderName:           "MLS Platform",
                SenderPhone:          "0900000000",
                SenderAddress:        "123 Nguyen Hue, Q.1",
                SenderProvinceCode:   "HCM",
                SenderDistrictCode:   "001",
                ReceiverName:         addr.Name,
                ReceiverPhone:        addr.Phone,
                ReceiverAddress:      addr.Address,
                ReceiverProvinceCode: addr.Province ?? "",
                ReceiverDistrictCode: addr.District ?? "",
                ReceiverWardCode:     addr.Ward,
                Weight:               weight,
                DeclaredValue:        order.FinalAmount,
                Note:                 addr.Notes);

            var result = await shipping.CreateShipmentAsync(req, ct);

            if (result.Success && result.TrackingNumber != null)
            {
                shipment.SetTrackingNumber(result.TrackingNumber, result.RawResponse);
                order.UpdateShippingStatus("Pending", shipping.ProviderName);

                db.ShipmentTrackingLogs.Add(ShipmentTrackingLog.Create(
                    shipment.Id, "Pending", "Vận đơn đã được tạo tự động sau thanh toán"));

                logger.LogInformation("Shipment {Tracking} created for order {OrderId}.",
                    result.TrackingNumber, notification.OrderId);
            }
            else
            {
                order.UpdateShippingStatus("Pending", shipping.ProviderName);
                logger.LogWarning("Provider failed to create shipment for order {OrderId}: {Err}",
                    notification.OrderId, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception creating shipment for order {OrderId}.", notification.OrderId);
            order.UpdateShippingStatus("Pending", shipping.ProviderName);
        }

        await db.SaveChangesAsync(ct);
    }
}
