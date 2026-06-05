using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MLS.Application.Common.Interfaces;

namespace MLS.Infrastructure.Shipping;

/// <summary>
/// ViettelPost carrier implementation of IShippingProvider.
/// Docs: https://partner.viettelpost.vn/v2
/// </summary>
public class ViettelPostProvider(
    HttpClient              http,
    IOptions<ShippingSettings> options,
    ILogger<ViettelPostProvider> logger)
    : IShippingProvider
{
    private readonly ShippingSettings _settings = options.Value;

    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    public string ProviderName => "ViettelPost";

    // ── Token cache ──────────────────────────────────────────────────────────
    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    private async Task<string?> GetTokenAsync(CancellationToken ct)
    {
        if (_settings.ApiToken is { Length: > 0 })
            return _settings.ApiToken;

        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
            return _cachedToken;

        try
        {
            var body = new { username = _settings.Username, password = _settings.Password };
            var resp = await http.PostAsJsonAsync(
                $"{_settings.BaseUrl}/user/Login",
                body,
                _json, ct);

            resp.EnsureSuccessStatusCode();
            var raw  = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
            var data = raw.GetProperty("data");
            _cachedToken = data.GetProperty("token").GetString();
            _tokenExpiry = DateTime.UtcNow.AddHours(23); // tokens usually last 24h
            return _cachedToken;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to obtain ViettelPost token.");
            return null;
        }
    }

    private void SetAuthHeader(string token)
        => http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    // ── CalculateFee ─────────────────────────────────────────────────────────

    public async Task<ShippingFeeResult> CalculateFeeAsync(CalculateFeeRequest request, CancellationToken ct)
    {
        var token = await GetTokenAsync(ct);
        if (token == null)
            return new ShippingFeeResult(false, 0m, null, "Cannot obtain auth token.");

        SetAuthHeader(token);

        try
        {
            var body = new
            {
                SENDER_PROVINCE   = TryParseInt(request.SenderProvinceCode),
                SENDER_DISTRICT   = TryParseInt(request.SenderDistrictCode),
                RECEIVER_PROVINCE = TryParseInt(request.ReceiverProvinceCode),
                RECEIVER_DISTRICT = TryParseInt(request.ReceiverDistrictCode),
                PRODUCT_WEIGHT    = request.Weight,
                PRODUCT_PRICE     = 0,
                MONEY_COLLECTION  = 0,
                TYPE              = 1,   // 1 = B2C
                LIST_SERVICE      = new[] { new { SERVICE_CODE = request.ServiceCode } }
            };

            var resp = await http.PostAsJsonAsync($"{_settings.BaseUrl}/order/getPriceAll", body, _json, ct);
            resp.EnsureSuccessStatusCode();
            var raw  = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
            var data = raw.GetProperty("data");

            if (data.ValueKind == JsonValueKind.Array && data.GetArrayLength() > 0)
            {
                var svc     = data[0];
                var fee     = svc.TryGetProperty("GIA_CUOC", out var gp)   ? gp.GetDecimal()   : 0m;
                var svcName = svc.TryGetProperty("TEN_DICHVU", out var tnp) ? tnp.GetString()   : null;
                return new ShippingFeeResult(true, fee, svcName);
            }

            return new ShippingFeeResult(false, 0m, null, "No fee data returned.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CalculateFee failed.");
            return new ShippingFeeResult(false, 0m, null, ex.Message);
        }
    }

    // ── CreateShipment ───────────────────────────────────────────────────────

    public async Task<CreateShipmentResult> CreateShipmentAsync(CreateShipmentRequest request, CancellationToken ct)
    {
        var token = await GetTokenAsync(ct);
        if (token == null)
            return new CreateShipmentResult(false, null, 0m, null, "Cannot obtain auth token.");

        SetAuthHeader(token);

        try
        {
            var body = new
            {
                ORDER_NUMBER      = request.OrderCode,
                SENDER_FULLNAME   = request.SenderName,
                SENDER_ADDRESS    = request.SenderAddress,
                SENDER_PHONE      = request.SenderPhone,
                SENDER_EMAIL      = "",
                SENDER_WARD       = 0,
                SENDER_DISTRICT   = TryParseInt(request.SenderDistrictCode),
                SENDER_PROVINCE   = TryParseInt(request.SenderProvinceCode),
                RECEIVER_FULLNAME = request.ReceiverName,
                RECEIVER_ADDRESS  = request.ReceiverAddress,
                RECEIVER_PHONE    = request.ReceiverPhone,
                RECEIVER_EMAIL    = "",
                RECEIVER_WARD     = TryParseInt(request.ReceiverWardCode),
                RECEIVER_DISTRICT = TryParseInt(request.ReceiverDistrictCode),
                RECEIVER_PROVINCE = TryParseInt(request.ReceiverProvinceCode),
                PRODUCT_NAME      = "Sách giáo dục",
                PRODUCT_DESCRIPTION = request.Note,
                PRODUCT_QUANTITY  = 1,
                PRODUCT_PRICE     = (int)request.DeclaredValue,
                PRODUCT_WEIGHT    = request.Weight,
                PRODUCT_LENGTH    = 20,
                PRODUCT_WIDTH     = 15,
                PRODUCT_HEIGHT    = 10,
                ORDER_PAYMENT     = 3,   // 3 = người gửi trả phí
                ORDER_SERVICE     = _settings.DefaultServiceCode,
                ORDER_SERVICE_ADD = "",
                ORDER_VOUCHER     = "",
                MONEY_COLLECTION  = 0,
                LIST_ITEM         = Array.Empty<object>()
            };

            var resp = await http.PostAsJsonAsync($"{_settings.BaseUrl}/order/createOrder", body, _json, ct);
            resp.EnsureSuccessStatusCode();

            var rawStr = await resp.Content.ReadAsStringAsync(ct);
            var raw    = JsonDocument.Parse(rawStr).RootElement;

            if (!raw.TryGetProperty("status", out var statusEl) || statusEl.GetInt32() != 200)
            {
                var msg = raw.TryGetProperty("message", out var m) ? m.GetString() : "Unknown error";
                return new CreateShipmentResult(false, null, 0m, rawStr, msg);
            }

            var data      = raw.GetProperty("data");
            var tracking  = data.GetProperty("ORDER_NUMBER").GetString();
            var fee       = data.TryGetProperty("MONEY_TOTAL", out var mt) ? mt.GetDecimal() : 0m;

            return new CreateShipmentResult(true, tracking, fee, rawStr);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CreateShipment failed for {OrderCode}.", request.OrderCode);
            return new CreateShipmentResult(false, null, 0m, null, ex.Message);
        }
    }

    // ── TrackShipment ────────────────────────────────────────────────────────

    public async Task<TrackingResult> TrackShipmentAsync(string trackingNumber, CancellationToken ct)
    {
        var token = await GetTokenAsync(ct);
        if (token == null)
            return new TrackingResult(false, "Unknown", [], "Cannot obtain auth token.");

        SetAuthHeader(token);

        try
        {
            var resp = await http.GetAsync(
                $"{_settings.BaseUrl}/order/getOrderByOrderNumber?ORDER_NUMBER={Uri.EscapeDataString(trackingNumber)}", ct);
            resp.EnsureSuccessStatusCode();

            var raw  = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
            var data = raw.GetProperty("data");

            var statusCode = data.TryGetProperty("ORDER_STATUS", out var sc)
                ? sc.GetInt32().ToString() : "Unknown";

            var internalStatus = MapViettelPostStatus(statusCode);

            // Parse history
            var history = new List<TrackingEvent>();
            if (data.TryGetProperty("HISTORY", out var hist) && hist.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in hist.EnumerateArray())
                {
                    var desc  = item.TryGetProperty("DESCRIPTION", out var d) ? d.GetString() : null;
                    var timeS = item.TryGetProperty("DATE_CHANGE",  out var dt) ? dt.GetString() : null;
                    var time  = DateTime.TryParse(timeS, out var t) ? t : DateTime.UtcNow;
                    var sStat = item.TryGetProperty("STATUS", out var s) ? s.GetInt32().ToString() : statusCode;
                    history.Add(new TrackingEvent(MapViettelPostStatus(sStat), desc, time));
                }
            }

            return new TrackingResult(true, internalStatus, history);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "TrackShipment failed for {Tracking}.", trackingNumber);
            return new TrackingResult(false, "Unknown", [], ex.Message);
        }
    }

    // ── CancelShipment ───────────────────────────────────────────────────────

    public async Task<bool> CancelShipmentAsync(string trackingNumber, CancellationToken ct)
    {
        var token = await GetTokenAsync(ct);
        if (token == null) return false;

        SetAuthHeader(token);

        try
        {
            var body = new
            {
                TYPE         = 4,   // 4 = cancel
                ORDER_NUMBER = trackingNumber
            };
            var resp = await http.PostAsJsonAsync($"{_settings.BaseUrl}/order/UpdateOrder", body, _json, ct);
            resp.EnsureSuccessStatusCode();

            var raw = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
            return raw.TryGetProperty("status", out var s) && s.GetInt32() == 200;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CancelShipment failed for {Tracking}.", trackingNumber);
            return false;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static int TryParseInt(string? s)
        => int.TryParse(s, out var v) ? v : 0;

    /// <summary>
    /// Map ViettelPost numeric status codes → internal status strings.
    /// </summary>
    internal static string MapViettelPostStatus(string code) => code switch
    {
        "501" => "Pending",
        "502" => "PickedUp",
        "503" => "InTransit",
        "504" => "Delivered",
        "505" => "InTransit",
        "506" => "Failed",
        "507" => "Returned",
        "508" => "Cancelled",
        _     => "InTransit",
    };

    /// <summary>
    /// Validates a ViettelPost webhook HMAC-SHA256 signature.
    /// The carrier sends: X-Signature: HMAC(secret, rawBody)
    /// </summary>
    public static bool ValidateWebhookSignature(string rawBody, string receivedSignature, string secret)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody))).ToLowerInvariant();
        return computed == receivedSignature.ToLowerInvariant();
    }
}
