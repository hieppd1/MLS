using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class PackageEntitlement : BaseEntity
{
    public Guid PackageId { get; private set; }
    public string FeatureCode { get; private set; } = string.Empty;
    public bool Enabled { get; private set; }

    public CoursePackage Package { get; private set; } = null!;

    private PackageEntitlement() { }

    public static PackageEntitlement Create(Guid packageId, string featureCode, bool enabled)
        => new()
        {
            Id = Guid.NewGuid(),
            PackageId = packageId,
            FeatureCode = featureCode.ToLowerInvariant().Trim(),
            Enabled = enabled,
            CreatedAt = DateTime.UtcNow,
        };

    public void SetEnabled(bool enabled) { Enabled = enabled; SetUpdatedAt(); }
}
