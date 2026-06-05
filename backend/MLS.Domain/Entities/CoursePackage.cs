using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum PackageType { Basic, Standard, Advance }
public enum PackageStatus { Draft, Active, Archived }
public enum StudentPackageStatus { Active, Expired, Cancelled }

public class CoursePackage : BaseEntity
{
    public Guid CourseId { get; private set; }
    public PackageType PackageType { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal OriginalPrice { get; private set; }
    public decimal SalePrice { get; private set; }
    public int DurationDay { get; private set; }  // 0 = lifetime
    public PackageStatus Status { get; private set; } = PackageStatus.Draft;

    /// <summary>
    /// Monthly test-attempt quota granted by this package.
    /// null = use PackageType default (Basic→2, Standard→4, Advance→4).
    /// 0 = unlimited.
    /// </summary>
    public int? MonthlyTestQuota { get; private set; }

    // Navigation
    public ICollection<PackageEntitlement> Entitlements { get; private set; } = [];
    public ICollection<StudentPackage> StudentPackages { get; private set; } = [];

    private CoursePackage() { }

    public static CoursePackage Create(
        Guid courseId, PackageType packageType, string title, string? description,
        decimal originalPrice, decimal salePrice, int durationDay)
        => new()
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            PackageType = packageType,
            Title = title.Trim(),
            Description = description?.Trim(),
            OriginalPrice = originalPrice,
            SalePrice = salePrice,
            DurationDay = durationDay,
            Status = PackageStatus.Draft,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(string title, string? description, decimal originalPrice, decimal salePrice, int durationDay)
    {
        Title = title.Trim();
        Description = description?.Trim();
        OriginalPrice = originalPrice;
        SalePrice = salePrice;
        DurationDay = durationDay;
        SetUpdatedAt();
    }

    public void SetMonthlyTestQuota(int? quota) { MonthlyTestQuota = quota; SetUpdatedAt(); }

    /// <summary>Resolved monthly test quota: explicit value, or PackageType default.</summary>
    public int ResolvedMonthlyTestQuota => MonthlyTestQuota ?? PackageType switch
    {
        PackageType.Basic   => 2,
        PackageType.Standard => 4,
        PackageType.Advance  => 4,
        _ => 2
    };

    public void Activate() { Status = PackageStatus.Active; SetUpdatedAt(); }
    public void Archive() { Status = PackageStatus.Archived; SetUpdatedAt(); }

    /// <summary>Effective price — sale price if set, otherwise original.</summary>
    public decimal EffectivePrice => SalePrice > 0 ? SalePrice : OriginalPrice;
}
