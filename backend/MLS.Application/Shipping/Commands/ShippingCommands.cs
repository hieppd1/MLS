using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Shipping.Commands;

// ── DTO used in responses ─────────────────────────────────────────────────

public record ShipmentDto(
    Guid   Id,
    Guid   OrderId,
    string Provider,
    string? TrackingNumber,
    string Status,
    decimal ShippingFee,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? ProvinceCode,
    string? DistrictCode,
    string? WardCode,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

// ── CreateShipmentCommand ────────────────────────────────────────────────

public record CreateShipmentCommand(
    Guid   OrderId,
    string ReceiverName,
    string ReceiverPhone,
    string ReceiverAddress,
    string? ProvinceCode,
    string? DistrictCode,
    string? WardCode,
    int    Weight = 500,
    string? Note = null) : IRequest<ShipmentDto>;

public class CreateShipmentCommandHandler(
    IApplicationDbContext db,
    IShippingProvider     shipping)
    : IRequestHandler<CreateShipmentCommand, ShipmentDto>
{
    public async Task<ShipmentDto> Handle(CreateShipmentCommand cmd, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == cmd.OrderId, ct)
            ?? throw new KeyNotFoundException($"Order {cmd.OrderId} not found.");

        // Calculate declared value from order
        var declared = order.FinalAmount;

        // Build shipping request (sender info comes from app settings / hard-coded for now)
        var req = new CreateShipmentRequest(
            OrderCode:           order.OrderCode,
            SenderName:          "MLS Platform",
            SenderPhone:         "0900000000",
            SenderAddress:       "123 Nguyen Hue, Q.1",
            SenderProvinceCode:  "HCM",
            SenderDistrictCode:  "001",
            ReceiverName:        cmd.ReceiverName,
            ReceiverPhone:       cmd.ReceiverPhone,
            ReceiverAddress:     cmd.ReceiverAddress,
            ReceiverProvinceCode: cmd.ProvinceCode ?? "",
            ReceiverDistrictCode: cmd.DistrictCode ?? "",
            ReceiverWardCode:    cmd.WardCode,
            Weight:              cmd.Weight,
            DeclaredValue:       declared,
            Note:                cmd.Note);

        // Calculate fee first
        var feeResult = await shipping.CalculateFeeAsync(
            new CalculateFeeRequest("HCM", "001", cmd.ProvinceCode ?? "HCM", cmd.DistrictCode ?? "001", cmd.Weight), ct);

        var fee = feeResult.Success ? feeResult.Fee : 0m;

        // Create shipment record
        var shipment = Shipment.Create(
            cmd.OrderId,
            cmd.ReceiverName,
            cmd.ReceiverPhone,
            cmd.ReceiverAddress,
            cmd.ProvinceCode,
            cmd.DistrictCode,
            cmd.WardCode,
            fee);

        db.Shipments.Add(shipment);

        // Call provider API
        var result = await shipping.CreateShipmentAsync(req, ct);

        if (result.Success && result.TrackingNumber != null)
        {
            shipment.SetTrackingNumber(result.TrackingNumber, result.RawResponse);
            order.UpdateShippingStatus("Pending", shipping.ProviderName);

            db.ShipmentTrackingLogs.Add(ShipmentTrackingLog.Create(
                shipment.Id, "Pending", "Vận đơn đã được tạo"));
        }
        else
        {
            // Keep shipment in Pending state, admin can retry sync
            order.UpdateShippingStatus("Pending", shipping.ProviderName);
        }

        await db.SaveChangesAsync(ct);

        return ToDto(shipment);
    }

    private static ShipmentDto ToDto(Shipment s) => new(
        s.Id, s.OrderId, s.Provider, s.TrackingNumber, s.Status.ToString(),
        s.ShippingFee, s.ReceiverName, s.ReceiverPhone, s.ReceiverAddress,
        s.ProvinceCode, s.DistrictCode, s.WardCode, s.CreatedAt, s.UpdatedAt);
}

// ── CancelShipmentCommand ─────────────────────────────────────────────────

public record CancelShipmentCommand(Guid ShipmentId) : IRequest;

public class CancelShipmentCommandHandler(
    IApplicationDbContext db,
    IShippingProvider     shipping)
    : IRequestHandler<CancelShipmentCommand>
{
    public async Task Handle(CancelShipmentCommand cmd, CancellationToken ct)
    {
        var shipment = await db.Shipments
            .FirstOrDefaultAsync(s => s.Id == cmd.ShipmentId, ct)
            ?? throw new KeyNotFoundException("Shipment not found.");

        if (shipment.TrackingNumber != null)
            await shipping.CancelShipmentAsync(shipment.TrackingNumber, ct);

        shipment.Cancel();

        db.ShipmentTrackingLogs.Add(ShipmentTrackingLog.Create(
            shipment.Id, "Cancelled", "Vận đơn đã được hủy"));

        await db.SaveChangesAsync(ct);
    }
}

// ── SyncShipmentStatusCommand ─────────────────────────────────────────────

public record SyncShipmentStatusCommand(Guid ShipmentId) : IRequest<ShipmentDto>;

public class SyncShipmentStatusCommandHandler(
    IApplicationDbContext db,
    IShippingProvider     shipping)
    : IRequestHandler<SyncShipmentStatusCommand, ShipmentDto>
{
    private static readonly Dictionary<string, ShippingStatus> StatusMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Pending"]     = ShippingStatus.Pending,
        ["PickedUp"]    = ShippingStatus.PickedUp,
        ["InTransit"]   = ShippingStatus.InTransit,
        ["Delivered"]   = ShippingStatus.Delivered,
        ["Failed"]      = ShippingStatus.Failed,
        ["Returned"]    = ShippingStatus.Returned,
        ["Cancelled"]   = ShippingStatus.Cancelled,
    };

    public async Task<ShipmentDto> Handle(SyncShipmentStatusCommand cmd, CancellationToken ct)
    {
        var shipment = await db.Shipments
            .FirstOrDefaultAsync(s => s.Id == cmd.ShipmentId, ct)
            ?? throw new KeyNotFoundException("Shipment not found.");

        if (shipment.TrackingNumber == null)
            return ToDtoStatic(shipment);

        var tracking = await shipping.TrackShipmentAsync(shipment.TrackingNumber, ct);

        if (tracking.Success && StatusMap.TryGetValue(tracking.Status, out var newStatus)
            && newStatus != shipment.Status)
        {
            shipment.UpdateStatus(newStatus);

            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == shipment.OrderId, ct);
            order?.UpdateShippingStatus(tracking.Status, shipping.ProviderName);

            db.ShipmentTrackingLogs.Add(ShipmentTrackingLog.Create(
                shipment.Id, tracking.Status,
                tracking.Events.LastOrDefault()?.Description));

            await db.SaveChangesAsync(ct);
        }

        return ToDtoStatic(shipment);
    }

    private static ShipmentDto ToDtoStatic(Shipment s) => new(
        s.Id, s.OrderId, s.Provider, s.TrackingNumber, s.Status.ToString(),
        s.ShippingFee, s.ReceiverName, s.ReceiverPhone, s.ReceiverAddress,
        s.ProvinceCode, s.DistrictCode, s.WardCode, s.CreatedAt, s.UpdatedAt);
}

// ── ProcessViettelPostWebhookCommand ──────────────────────────────────────

public record ProcessViettelPostWebhookCommand(
    string  TrackingNumber,
    string  Status,
    string? Description,
    string? RawPayload) : IRequest;

public class ProcessViettelPostWebhookCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ProcessViettelPostWebhookCommand>
{
    private static readonly Dictionary<string, ShippingStatus> StatusMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["501"] = ShippingStatus.Pending,
        ["502"] = ShippingStatus.PickedUp,
        ["503"] = ShippingStatus.InTransit,
        ["504"] = ShippingStatus.Delivered,
        ["506"] = ShippingStatus.Failed,
        ["507"] = ShippingStatus.Returned,
        ["508"] = ShippingStatus.Cancelled,
        ["Pending"]   = ShippingStatus.Pending,
        ["PickedUp"]  = ShippingStatus.PickedUp,
        ["InTransit"] = ShippingStatus.InTransit,
        ["Delivered"] = ShippingStatus.Delivered,
        ["Failed"]    = ShippingStatus.Failed,
        ["Returned"]  = ShippingStatus.Returned,
        ["Cancelled"] = ShippingStatus.Cancelled,
    };

    public async Task Handle(ProcessViettelPostWebhookCommand cmd, CancellationToken ct)
    {
        var shipment = await db.Shipments
            .FirstOrDefaultAsync(s => s.TrackingNumber == cmd.TrackingNumber, ct);

        if (shipment == null) return;

        db.ShipmentTrackingLogs.Add(ShipmentTrackingLog.Create(
            shipment.Id, cmd.Status, cmd.Description, cmd.RawPayload));

        if (StatusMap.TryGetValue(cmd.Status, out var newStatus))
        {
            shipment.UpdateStatus(newStatus);

            var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == shipment.OrderId, ct);
            order?.UpdateShippingStatus(newStatus.ToString(), "ViettelPost");

            if (newStatus == ShippingStatus.Delivered)
                order?.Complete();
        }

        await db.SaveChangesAsync(ct);
    }
}
