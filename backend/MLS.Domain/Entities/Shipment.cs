using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ShippingStatus
{
    Pending,
    PickedUp,
    InTransit,
    Delivered,
    Failed,
    Returned,
    Cancelled
}

public class Shipment : BaseEntity
{
    public Guid     OrderId         { get; private set; }
    public string   Provider        { get; private set; } = "ViettelPost";
    public string?  TrackingNumber  { get; private set; }
    public ShippingStatus Status    { get; private set; } = ShippingStatus.Pending;
    public decimal  ShippingFee     { get; private set; }
    public string   ReceiverName    { get; private set; } = string.Empty;
    public string   ReceiverPhone   { get; private set; } = string.Empty;
    public string   ReceiverAddress { get; private set; } = string.Empty;
    public string?  ProvinceCode    { get; private set; }
    public string?  DistrictCode    { get; private set; }
    public string?  WardCode        { get; private set; }
    public string?  RawResponse     { get; private set; }  // JSON from provider

    // Navigation
    public Order Order { get; private set; } = null!;
    public ICollection<ShipmentTrackingLog> TrackingLogs { get; private set; } = [];

    private Shipment() { }

    public static Shipment Create(
        Guid    orderId,
        string  receiverName,
        string  receiverPhone,
        string  receiverAddress,
        string? provinceCode,
        string? districtCode,
        string? wardCode,
        decimal shippingFee)
        => new()
        {
            Id              = Guid.NewGuid(),
            OrderId         = orderId,
            ReceiverName    = receiverName.Trim(),
            ReceiverPhone   = receiverPhone.Trim(),
            ReceiverAddress = receiverAddress.Trim(),
            ProvinceCode    = provinceCode,
            DistrictCode    = districtCode,
            WardCode        = wardCode,
            ShippingFee     = shippingFee,
            Status          = ShippingStatus.Pending,
            CreatedAt       = DateTime.UtcNow,
        };

    public void SetTrackingNumber(string trackingNumber, string? rawResponse = null)
    {
        TrackingNumber = trackingNumber;
        RawResponse    = rawResponse;
        SetUpdatedAt();
    }

    public void UpdateStatus(ShippingStatus status)
    {
        Status = status;
        SetUpdatedAt();
    }

    public void Cancel()
    {
        Status = ShippingStatus.Cancelled;
        SetUpdatedAt();
    }
}

public class ShipmentTrackingLog : BaseEntity
{
    public Guid    ShipmentId  { get; private set; }
    public string  Status      { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? RawData     { get; private set; }  // JSON webhook payload

    public Shipment Shipment { get; private set; } = null!;

    private ShipmentTrackingLog() { }

    public static ShipmentTrackingLog Create(
        Guid    shipmentId,
        string  status,
        string? description,
        string? rawData = null)
        => new()
        {
            Id          = Guid.NewGuid(),
            ShipmentId  = shipmentId,
            Status      = status,
            Description = description,
            RawData     = rawData,
            CreatedAt   = DateTime.UtcNow,
        };
}
