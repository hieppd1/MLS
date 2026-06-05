using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Shipping.Commands;
using MLS.Domain.Entities;

namespace MLS.Application.Shipping.Queries;

// ── GetShipmentQuery ──────────────────────────────────────────────────────

public record GetShipmentQuery(Guid Id) : IRequest<ShipmentDetailDto?>;

public record TrackingEventDto(string Status, string? Description, DateTime CreatedAt);

public record ShipmentDetailDto(
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
    DateTime? UpdatedAt,
    IReadOnlyList<TrackingEventDto> History);

public class GetShipmentQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetShipmentQuery, ShipmentDetailDto?>
{
    public async Task<ShipmentDetailDto?> Handle(GetShipmentQuery q, CancellationToken ct)
    {
        var s = await db.Shipments
            .Include(x => x.TrackingLogs.OrderBy(l => l.CreatedAt))
            .FirstOrDefaultAsync(x => x.Id == q.Id, ct);

        return s == null ? null : ToDetail(s);
    }

    internal static ShipmentDetailDto ToDetail(Shipment s) => new(
        s.Id, s.OrderId, s.Provider, s.TrackingNumber, s.Status.ToString(),
        s.ShippingFee, s.ReceiverName, s.ReceiverPhone, s.ReceiverAddress,
        s.ProvinceCode, s.DistrictCode, s.WardCode, s.CreatedAt, s.UpdatedAt,
        s.TrackingLogs.Select(l => new TrackingEventDto(l.Status, l.Description, l.CreatedAt)).ToList());
}

// ── GetShipmentByOrderIdQuery ─────────────────────────────────────────────

public record GetShipmentByOrderIdQuery(Guid OrderId) : IRequest<ShipmentDetailDto?>;

public class GetShipmentByOrderIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetShipmentByOrderIdQuery, ShipmentDetailDto?>
{
    public async Task<ShipmentDetailDto?> Handle(GetShipmentByOrderIdQuery q, CancellationToken ct)
    {
        var s = await db.Shipments
            .Include(x => x.TrackingLogs.OrderBy(l => l.CreatedAt))
            .FirstOrDefaultAsync(x => x.OrderId == q.OrderId, ct);

        return s == null ? null : GetShipmentQueryHandler.ToDetail(s);
    }
}

// ── TrackShipmentQuery ────────────────────────────────────────────────────

public record TrackShipmentQuery(string TrackingNumber) : IRequest<TrackingResult?>;

public class TrackShipmentQueryHandler(
    IApplicationDbContext db,
    IShippingProvider     shipping)
    : IRequestHandler<TrackShipmentQuery, TrackingResult?>
{
    public async Task<TrackingResult?> Handle(TrackShipmentQuery q, CancellationToken ct)
    {
        var exists = await db.Shipments.AnyAsync(s => s.TrackingNumber == q.TrackingNumber, ct);
        if (!exists) return null;

        return await shipping.TrackShipmentAsync(q.TrackingNumber, ct);
    }
}

// ── CalculateShippingFeeQuery ─────────────────────────────────────────────

public record CalculateShippingFeeQuery(
    string ReceiverProvinceCode,
    string ReceiverDistrictCode,
    int    Weight = 500) : IRequest<ShippingFeeResult>;

public class CalculateShippingFeeQueryHandler(IShippingProvider shipping)
    : IRequestHandler<CalculateShippingFeeQuery, ShippingFeeResult>
{
    public Task<ShippingFeeResult> Handle(CalculateShippingFeeQuery q, CancellationToken ct)
        => shipping.CalculateFeeAsync(
            new CalculateFeeRequest("HCM", "001", q.ReceiverProvinceCode, q.ReceiverDistrictCode, q.Weight), ct);
}

// ── GetAdminShipmentsQuery ────────────────────────────────────────────────

public record AdminShipmentRow(
    Guid   Id,
    Guid   OrderId,
    string OrderCode,
    string Provider,
    string? TrackingNumber,
    string Status,
    decimal ShippingFee,
    string ReceiverName,
    string ReceiverPhone,
    DateTime CreatedAt);

public record AdminShipmentsResponse(
    IReadOnlyList<AdminShipmentRow> Items,
    int Total,
    int Page,
    int PageSize);

public record GetAdminShipmentsQuery(
    int     Page     = 1,
    int     PageSize = 20,
    string? Status   = null,
    string? Search   = null) : IRequest<AdminShipmentsResponse>;

public class GetAdminShipmentsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminShipmentsQuery, AdminShipmentsResponse>
{
    public async Task<AdminShipmentsResponse> Handle(GetAdminShipmentsQuery q, CancellationToken ct)
    {
        var query = db.Shipments
            .Include(s => s.Order)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Status))
            query = query.Where(s => s.Status.ToString() == q.Status);

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(s =>
                s.TrackingNumber!.Contains(q.Search) ||
                s.ReceiverName.Contains(q.Search) ||
                s.ReceiverPhone.Contains(q.Search) ||
                s.Order.OrderCode.Contains(q.Search));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(s => new AdminShipmentRow(
                s.Id, s.OrderId, s.Order.OrderCode, s.Provider,
                s.TrackingNumber, s.Status.ToString(), s.ShippingFee,
                s.ReceiverName, s.ReceiverPhone, s.CreatedAt))
            .ToListAsync(ct);

        return new AdminShipmentsResponse(items, total, q.Page, q.PageSize);
    }
}
