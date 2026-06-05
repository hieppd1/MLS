namespace MLS.Infrastructure.Shipping;

public class ShippingSettings
{
    public const string Section = "Shipping";

    /// <summary>ViettelPost partner username</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>ViettelPost partner password</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>Long-lived API token (alternative to username/password flow)</summary>
    public string? ApiToken { get; set; }

    /// <summary>ViettelPost API base URL (default: partner API)</summary>
    public string BaseUrl { get; set; } = "https://partner.viettelpost.vn/v2";

    /// <summary>Secret used to validate inbound webhooks from ViettelPost</summary>
    public string WebhookSecret { get; set; } = string.Empty;

    /// <summary>Default service code (LCOD = Giao hàng thu tiền)</summary>
    public string DefaultServiceCode { get; set; } = "LCOD";

    /// <summary>Sender province code (from ViettelPost province list)</summary>
    public string SenderProvinceCode { get; set; } = "HCM";

    /// <summary>Sender district code</summary>
    public string SenderDistrictCode { get; set; } = "001";

    /// <summary>Sender full name</summary>
    public string SenderName { get; set; } = "MLS Platform";

    /// <summary>Sender phone number</summary>
    public string SenderPhone { get; set; } = "0900000000";

    /// <summary>Sender address string</summary>
    public string SenderAddress { get; set; } = "123 Nguyễn Huệ, Quận 1, TP.HCM";
}
