using MLS.Infrastructure.MultiTenancy;

namespace MLS.API.Middleware;

/// <summary>
/// Resolves the current tenant from the incoming HTTP request.
///
/// Resolution order:
///   1. Header:    X-Tenant-Slug: abc  (highest priority — works everywhere)
///   2. Subdomain: abc.viet-study.vn   → slug = "abc"
///   3. Query:     ?tenant=abc          (Development only)
///
/// Returns 400 if no tenant resolved (except /health and /swagger).
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    private static readonly HashSet<string> ReservedSubdomains =
        ["www", "api", "admin", "static", "health", "localhost"];

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger, IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
        // Skip CORS preflight — CORS middleware handles it before reaching here
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            await _next(context);
            return;
        }

        var slug = ResolveSlug(context);

        if (slug is null)
        {
            var path = context.Request.Path.Value ?? "";
            // Skip tenant resolution for SignalR hubs — they use query param ?tenant=
            if (path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }
            if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/swagger"))
            {
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Tenant could not be resolved. Use X-Tenant-Slug header or correct subdomain.",
                errors = Array.Empty<string>()
            });
            return;
        }

        tenantContext.SetTenant(slug);
        _logger.LogDebug("Request tenant resolved: {TenantSlug}", slug);

        await _next(context);
    }

    private string? ResolveSlug(HttpContext context)
    {
        // 1. Header
        var headerSlug = context.Request.Headers["X-Tenant-Slug"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerSlug))
            return Sanitize(headerSlug);

        // 2. Subdomain (skip pure IP addresses — every octet is numeric)
        var host = context.Request.Host.Host;
        var parts = host.Split('.');
        var isIpAddress = parts.Length == 4 && parts.All(p => int.TryParse(p, out _));
        if (!isIpAddress && parts.Length >= 3)
        {
            var sub = parts[0].ToLowerInvariant();
            if (!ReservedSubdomains.Contains(sub))
                return Sanitize(sub);
        }

        // 3. Query string (always for /hubs/*, otherwise Development only)
        var isHubRequest = context.Request.Path.Value?.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase) ?? false;
        if (_env.IsDevelopment() || isHubRequest)
        {
            var querySlug = context.Request.Query["tenant"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(querySlug))
                return Sanitize(querySlug);
        }

        // 4. Development fallback — default to "demo" so direct API calls work without header
        if (_env.IsDevelopment())
            return "demo";

        return null;
    }

    private static string? Sanitize(string slug)
    {
        var clean = new string(slug.ToLowerInvariant()
            .Where(c => char.IsAsciiLetterOrDigit(c) || c == '-')
            .Take(50)
            .ToArray());

        return string.IsNullOrEmpty(clean) ? null : clean;
    }
}
