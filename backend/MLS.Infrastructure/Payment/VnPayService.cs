using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using MLS.Application.Common.Interfaces;

namespace MLS.Infrastructure.Payment;

public class VnPayService : IVnPayService
{
    private readonly string _tmnCode;
    private readonly string _hashSecret;
    private readonly string _payUrl;

    public VnPayService(IConfiguration config)
    {
        _tmnCode    = config["VNPay:TmnCode"]    ?? throw new InvalidOperationException("VNPay:TmnCode is not configured.");
        _hashSecret = config["VNPay:HashSecret"] ?? throw new InvalidOperationException("VNPay:HashSecret is not configured.");
        _payUrl     = config["VNPay:PayUrl"]     ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    }

    public string BuildPaymentUrl(VnPayPaymentRequest request)
    {
        // VNPay operates on Vietnam Standard Time (UTC+7)
        var vnNow = DateTime.UtcNow.AddHours(7);

        var @params = new SortedDictionary<string, string>
        {
            ["vnp_Version"]    = "2.1.0",
            ["vnp_Command"]    = "pay",
            ["vnp_TmnCode"]    = _tmnCode,
            ["vnp_Amount"]     = (request.Amount * 100).ToString(),   // VNPay unit = 1/100 VND
            ["vnp_CurrCode"]   = "VND",
            ["vnp_TxnRef"]     = request.OrderCode,
            ["vnp_OrderInfo"]  = request.OrderInfo,
            ["vnp_OrderType"]  = "other",
            ["vnp_Locale"]     = "vn",
            ["vnp_ReturnUrl"]  = request.ReturnUrl,
            ["vnp_IpAddr"]     = request.IpAddr,
            ["vnp_CreateDate"] = vnNow.ToString("yyyyMMddHHmmss"),
            ["vnp_ExpireDate"] = vnNow.AddMinutes(15).ToString("yyyyMMddHHmmss"),
        };

        // VNPay docs: hash is computed on URL-encoded key=value pairs (same as PHP urlencode)
        var hashData  = string.Join("&", @params.Select(kv =>
            $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));
        var signature = ComputeHmacSha512(hashData, _hashSecret);

        // The URL query string uses the same URL-encoded format
        return $"{_payUrl}?{hashData}&vnp_SecureHash={signature}";
    }

    public bool VerifySignature(
        IReadOnlyDictionary<string, string> queryParams,
        out string orderCode,
        out string responseCode)
    {
        orderCode    = queryParams.GetValueOrDefault("vnp_TxnRef",        "");
        responseCode = queryParams.GetValueOrDefault("vnp_ResponseCode",  "");

        var receivedHash = queryParams.GetValueOrDefault("vnp_SecureHash", "");
        if (string.IsNullOrEmpty(receivedHash)) return false;

        // VNPay only hashes vnp_* params; exclude vnp_SecureHash/vnp_SecureHashType.
        // Non-vnp_ params (e.g. tenant=) must also be excluded to match VNPay's hash.
        var filtered = new SortedDictionary<string, string>(
            queryParams
                .Where(kv => kv.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase)
                          && kv.Key != "vnp_SecureHash"
                          && kv.Key != "vnp_SecureHashType")
                .ToDictionary(kv => kv.Key, kv => kv.Value));

        // ASP.NET Core URL-decodes query params; re-encode with WebUtility.UrlEncode
        // to match VNPay's signature computation (urlencode(key)=urlencode(value))
        var hashData = string.Join("&", filtered.Select(kv =>
            $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));
        var expected = ComputeHmacSha512(hashData, _hashSecret);

        return string.Equals(expected, receivedHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeHmacSha512(string data, string key)
    {
        var keyBytes  = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA512(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLower();
    }
}
