namespace MLS.Infrastructure.Moodle;

public class MoodleOptions
{
    public const string Section = "Moodle";

    /// <summary>Set to true once a Moodle token is configured. Registration works fine when false.</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>Base URL of the Moodle instance, e.g. http://localhost:8080</summary>
    public string BaseUrl { get; set; } = "http://localhost:8080";

    /// <summary>
    /// Moodle web service token.
    /// How to get: Moodle Admin → Site admin → Server → Web services → Manage tokens → Add.
    /// Requires: Site admin → Plugins → Web services → Enable web services = ON,
    ///           REST protocol enabled, and a service with core_user functions.
    /// </summary>
    public string Token { get; set; } = string.Empty;
}
