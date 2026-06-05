namespace MLS.Application.Common.Interfaces;

public record MomoPaymentRequest(
    string OrderId,
    string RequestId,
    long   Amount,
    string OrderInfo,
    string RedirectUrl,
    string IpnUrl,
    string ExtraData = ""
);

public record MomoPaymentResult(
    bool   Success,
    string? PayUrl,
    string? Message
);

public record MomoIpnPayload
{
    public string  PartnerCode  { get; init; } = "";
    public string  RequestId    { get; init; } = "";
    public string  OrderId      { get; init; } = "";
    public long    Amount       { get; init; }
    public string  OrderInfo    { get; init; } = "";
    public string  OrderType    { get; init; } = "";
    public long    TransId      { get; init; }
    public int     ResultCode   { get; init; }
    public string  Message      { get; init; } = "";
    public string  PayType      { get; init; } = "";
    public long    ResponseTime { get; init; }
    public string  ExtraData    { get; init; } = "";
    public string  Signature    { get; init; } = "";
}

public interface IMomoPaymentService
{
    Task<MomoPaymentResult> CreatePaymentAsync(MomoPaymentRequest request, CancellationToken ct = default);
    bool VerifyIpnSignature(MomoIpnPayload payload);
}
