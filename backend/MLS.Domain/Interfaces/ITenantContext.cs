namespace MLS.Domain.Interfaces;

/// <summary>
/// Provides current tenant information resolved from the request context.
/// Injected as scoped service — valid for the lifetime of one HTTP request.
/// </summary>
public interface ITenantContext
{
    /// <summary>Tenant slug, e.g. "abc" from abc.viet-study.vn</summary>
    string TenantSlug { get; }

    /// <summary>PostgreSQL schema name for this tenant, e.g. "tenant_abc"</summary>
    string SchemaName { get; }

    /// <summary>True once the tenant has been successfully resolved</summary>
    bool IsResolved { get; }
}
