namespace MLS.Application.Common.Interfaces;

// ── Request / Result records ──────────────────────────────────────────────

public record CreateShipmentRequest(
    string  OrderCode,
    string  SenderName,
    string  SenderPhone,
    string  SenderAddress,
    string  SenderProvinceCode,
    string  SenderDistrictCode,
    string  ReceiverName,
    string  ReceiverPhone,
    string  ReceiverAddress,
    string  ReceiverProvinceCode,
    string  ReceiverDistrictCode,
    string? ReceiverWardCode,
    int     Weight,      // grams
    decimal DeclaredValue,
    string? Note = null);

public record CreateShipmentResult(
    bool    Success,
    string? TrackingNumber,
    decimal Fee,
    string? RawResponse,
    string? ErrorMessage = null);

public record TrackingEvent(
    string  Status,
    string  Description,
    DateTime? OccurredAt);

public record TrackingResult(
    bool   Success,
    string Status,
    IReadOnlyList<TrackingEvent> Events,
    string? ErrorMessage = null);

public record CalculateFeeRequest(
    string SenderProvinceCode,
    string SenderDistrictCode,
    string ReceiverProvinceCode,
    string ReceiverDistrictCode,
    int    Weight,     // grams
    string ServiceCode = "LCOD");

public record ShippingFeeResult(
    bool    Success,
    decimal Fee,
    string? ServiceName,
    string? ErrorMessage = null);

// ── Provider interface ────────────────────────────────────────────────────

/// <summary>
/// Abstraction over a shipping carrier (ViettelPost, GHN, GHTK …).
/// Each implementation calls the carrier's API.
/// </summary>
public interface IShippingProvider
{
    string ProviderName { get; }

    Task<CreateShipmentResult> CreateShipmentAsync(
        CreateShipmentRequest request,
        CancellationToken ct = default);

    Task<TrackingResult> TrackShipmentAsync(
        string trackingNumber,
        CancellationToken ct = default);

    Task<ShippingFeeResult> CalculateFeeAsync(
        CalculateFeeRequest request,
        CancellationToken ct = default);

    Task<bool> CancelShipmentAsync(
        string trackingNumber,
        CancellationToken ct = default);
}
