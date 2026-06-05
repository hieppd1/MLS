using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using MLS.Application.Common.Interfaces;

namespace MLS.Infrastructure.Payment;

/// <summary>
/// MoMo Payment API v2 (redirect-based web payment).
/// Docs: https://developers.momo.vn/v3/docs/payment/api/collection-link
/// </summary>
public class MomoPaymentService : IMomoPaymentService
{
    private readonly HttpClient _http;
    private readonly string _partnerCode;
    private readonly string _accessKey;
    private readonly string _secretKey;
    private readonly string _apiEndpoint;

    public MomoPaymentService(HttpClient http, IConfiguration config)
    {
        _http         = http;
        _partnerCode  = config["Momo:PartnerCode"]  ?? "MOMO";
        _accessKey    = config["Momo:AccessKey"]    ?? "";
        _secretKey    = config["Momo:SecretKey"]    ?? "";
        _apiEndpoint  = config["Momo:ApiEndpoint"]  ?? "https://test-payment.momo.vn/v2/gateway/api/create";
    }

    public async Task<MomoPaymentResult> CreatePaymentAsync(MomoPaymentRequest request, CancellationToken ct = default)
    {
        try
        {
            const string requestType = "payWithMethod";

            var rawSignature =
                $"accessKey={_accessKey}" +
                $"&amount={request.Amount}" +
                $"&extraData={request.ExtraData}" +
                $"&ipnUrl={request.IpnUrl}" +
                $"&orderId={request.OrderId}" +
                $"&orderInfo={request.OrderInfo}" +
                $"&partnerCode={_partnerCode}" +
                $"&redirectUrl={request.RedirectUrl}" +
                $"&requestId={request.RequestId}" +
                $"&requestType={requestType}";

            var signature = ComputeHmacSha256(rawSignature, _secretKey);

            var body = new
            {
                partnerCode = _partnerCode,
                requestId   = request.RequestId,
                amount      = request.Amount,
                orderId     = request.OrderId,
                orderInfo   = request.OrderInfo,
                redirectUrl = request.RedirectUrl,
                ipnUrl      = request.IpnUrl,
                lang        = "vi",
                extraData   = request.ExtraData,
                requestType,
                signature,
            };

            var json    = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var resp    = await _http.PostAsync(_apiEndpoint, content, ct);
            var raw     = await resp.Content.ReadAsStringAsync(ct);

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            if (root.TryGetProperty("resultCode", out var rc) && rc.GetInt32() == 0
                && root.TryGetProperty("payUrl", out var pu))
            {
                return new MomoPaymentResult(true, pu.GetString(), null);
            }

            var msg = root.TryGetProperty("message", out var m) ? m.GetString() : "MoMo error";
            return new MomoPaymentResult(false, null, msg);
        }
        catch (Exception ex)
        {
            return new MomoPaymentResult(false, null, ex.Message);
        }
    }

    public bool VerifyIpnSignature(MomoIpnPayload payload)
    {
        if (string.IsNullOrEmpty(_secretKey)) return false;

        var rawSignature =
            $"accessKey={_accessKey}" +
            $"&amount={payload.Amount}" +
            $"&extraData={payload.ExtraData}" +
            $"&message={payload.Message}" +
            $"&orderId={payload.OrderId}" +
            $"&orderInfo={payload.OrderInfo}" +
            $"&orderType={payload.OrderType}" +
            $"&partnerCode={payload.PartnerCode}" +
            $"&payType={payload.PayType}" +
            $"&requestId={payload.RequestId}" +
            $"&resultCode={payload.ResultCode}" +
            $"&transId={payload.TransId}";

        var expected = ComputeHmacSha256(rawSignature, _secretKey);
        return string.Equals(expected, payload.Signature, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeHmacSha256(string data, string key)
    {
        var keyBytes  = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        var hash      = HMACSHA256.HashData(keyBytes, dataBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
