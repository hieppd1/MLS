namespace MLS.Application.Common.Interfaces;

public record VnPayPaymentRequest(
    string OrderCode,
    long   Amount,       // VND (service multiplies ×100 internally)
    string OrderInfo,
    string ReturnUrl,
    string IpAddr);

public interface IVnPayService
{
    string BuildPaymentUrl(VnPayPaymentRequest request);

    /// <summary>
    /// Verifies the VNPay HMAC-SHA512 signature from the IPN / return URL query params.
    /// Sets <paramref name="orderCode"/> (vnp_TxnRef) and <paramref name="responseCode"/> (vnp_ResponseCode).
    /// </summary>
    bool VerifySignature(
        IReadOnlyDictionary<string, string> queryParams,
        out string orderCode,
        out string responseCode);
}
