using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.MultiTenancy;

/// <summary>
/// Mutable tenant context — set once per request by TenantMiddleware.
/// </summary>
public class TenantContext : ITenantContext
{
    private string? _tenantSlug;

    public string TenantSlug => _tenantSlug ?? throw new InvalidOperationException("Tenant has not been resolved for this request.");
    public string SchemaName => IsResolved ? $"tenant_{_tenantSlug}" : throw new InvalidOperationException("Tenant has not been resolved.");
    public bool IsResolved => _tenantSlug is not null;

    /// <summary>Called by TenantMiddleware after resolving the tenant.</summary>
    public void SetTenant(string slug) => _tenantSlug = slug.ToLowerInvariant().Trim();
}
