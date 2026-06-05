using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum TenantStatus { Active, Suspended, Trial }

public class Tenant : BaseEntity
{
    public string Slug { get; private set; } = default!;   // "abc" in abc.viet-study.vn
    public string Name { get; private set; } = default!;
    public string? Domain { get; private set; }             // custom domain if any
    public TenantStatus Status { get; private set; } = TenantStatus.Trial;
    public string? ContactEmail { get; private set; }

    private Tenant() { }

    public static Tenant Create(string slug, string name, string? contactEmail = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new Tenant
        {
            Slug = slug.ToLowerInvariant().Trim(),
            Name = name.Trim(),
            ContactEmail = contactEmail,
            Status = TenantStatus.Trial
        };
    }

    public void Activate() => Status = TenantStatus.Active;
    public void Suspend() => Status = TenantStatus.Suspended;

    public string SchemaName => $"tenant_{Slug}";
}
