using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.Moodle;

/// <summary>
/// Calls Moodle REST API using form-encoded requests (Moodle's native format).
/// All public methods swallow exceptions and log errors — they MUST NOT throw,
/// so that registration / profile update never fail due to Moodle downtime.
/// </summary>
public class MoodleService(
    HttpClient http,
    IOptions<MoodleOptions> opts,
    ILogger<MoodleService> logger) : IMoodleService
{
    private readonly MoodleOptions _opts = opts.Value;

    // ── IMoodleService ────────────────────────────────────────────────────────

    public async Task<long?> CreateUserAsync(Guid userId, string email, string fullName, CancellationToken ct = default)
    {
        if (!IsEnabled()) return null;

        var (firstName, lastName) = SplitName(fullName);

        var form = new Dictionary<string, string>
        {
            ["wstoken"]                  = _opts.Token,
            ["wsfunction"]               = "core_user_create_users",
            ["moodlewsrestformat"]       = "json",
            ["users[0][username]"]       = SanitizeUsername(email),
            ["users[0][password]"]       = GenerateTempPassword(userId),
            ["users[0][firstname]"]      = firstName,
            ["users[0][lastname]"]       = lastName,
            ["users[0][email]"]          = email,
            ["users[0][auth]"]           = "manual",   // users authenticate via our JWT, not Moodle login
        };

        try
        {
            var json = await PostAsync(form, ct);
            if (json is null) return null;

            var created = JsonSerializer.Deserialize<MoodleCreatedUser[]>(json, JsonOpts);
            var moodleId = created?.FirstOrDefault()?.id;

            if (moodleId.HasValue)
                logger.LogInformation("Moodle user created: moodleId={MoodleId} email={Email}", moodleId.Value, email);

            return moodleId;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Moodle CreateUserAsync threw unexpectedly for {Email}", email);
            return null;
        }
    }

    public async Task UpdateUserAsync(long moodleUserId, string fullName, CancellationToken ct = default)
    {
        if (!IsEnabled()) return;

        var (firstName, lastName) = SplitName(fullName);

        var form = new Dictionary<string, string>
        {
            ["wstoken"]              = _opts.Token,
            ["wsfunction"]           = "core_user_update_users",
            ["moodlewsrestformat"]   = "json",
            ["users[0][id]"]         = moodleUserId.ToString(),
            ["users[0][firstname]"]  = firstName,
            ["users[0][lastname]"]   = lastName,
        };

        try
        {
            await PostAsync(form, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Moodle UpdateUserAsync threw for MoodleId={MoodleUserId}", moodleUserId);
        }
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private bool IsEnabled()
    {
        if (!_opts.Enabled || string.IsNullOrWhiteSpace(_opts.Token))
        {
            logger.LogDebug("Moodle sync is disabled (Enabled={Enabled}, Token set={HasToken})",
                _opts.Enabled, !string.IsNullOrWhiteSpace(_opts.Token));
            return false;
        }
        return true;
    }

    /// <summary>
    /// Posts form data to Moodle REST endpoint, validates HTTP status, checks for Moodle error response.
    /// Returns raw JSON string, or null on any error.
    /// </summary>
    private async Task<string?> PostAsync(Dictionary<string, string> form, CancellationToken ct)
    {
        var url = $"{_opts.BaseUrl.TrimEnd('/')}/webservice/rest/server.php";
        HttpResponseMessage response;

        try
        {
            response = await http.PostAsync(url, new FormUrlEncodedContent(form), ct);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Moodle HTTP call failed to {Url}", url);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);

        // Moodle returns error as { "exception": "...", "errorcode": "...", "message": "..." }
        if (json.TrimStart().StartsWith('{') && json.Contains("\"exception\""))
        {
            logger.LogWarning("Moodle returned error response: {Response}", json);
            return null;
        }

        return json;
    }

    // Moodle username: must be lowercase, no spaces. Replace @ to avoid Moodle validation issues.
    private static string SanitizeUsername(string email)
        => email.ToLowerInvariant()
                .Replace("@", "_at_")
                .Replace("+", "_");

    private static (string First, string Last) SplitName(string fullName)
    {
        var trimmed = fullName.Trim();
        var space   = trimmed.IndexOf(' ');
        return space < 0
            ? (trimmed, ".")          // "." as placeholder last name to satisfy Moodle's required field
            : (trimmed[..space], trimmed[(space + 1)..]);
    }

    /// <summary>
    /// Deterministic temp password so we could reproduce it if needed.
    /// Users NEVER log into Moodle directly — all auth goes through our JWT.
    /// The password still meets Moodle's default complexity rules (upper, lower, digit, special).
    /// </summary>
    private static string GenerateTempPassword(Guid userId)
    {
        var hash = SHA256.HashData(userId.ToByteArray());
        // Take 12 chars of base64, replace URL-unsafe chars
        var b64 = Convert.ToBase64String(hash)[..12]
            .Replace("/", "A")
            .Replace("+", "B")
            .Replace("=", "C");
        return $"Mls@{b64}1";  // prefix ensures upper+special, suffix ensures digit
    }

    // ── JSON types ────────────────────────────────────────────────────────────
    private record MoodleCreatedUser(long id, string username);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };
}
