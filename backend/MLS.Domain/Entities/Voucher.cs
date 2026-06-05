using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum VoucherType { Percentage, FixedAmount }
public enum VoucherStatus { Active, Inactive, Expired }

public class Voucher : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public VoucherType Type { get; private set; } = VoucherType.Percentage;
    public decimal Value { get; private set; }           // % or fixed VND
    public decimal? MinOrderAmount { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public int? UsageLimit { get; private set; }
    public int UsageCount { get; private set; }
    public DateTime? StartsAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public VoucherStatus Status { get; private set; } = VoucherStatus.Active;
    public bool IsPublic { get; private set; } = true;

    private Voucher() { }

    public static Voucher Create(
        string code,
        VoucherType type,
        decimal value,
        string? description = null,
        decimal? minOrderAmount = null,
        decimal? maxDiscountAmount = null,
        int? usageLimit = null,
        DateTime? startsAt = null,
        DateTime? expiresAt = null,
        bool isPublic = true)
        => new()
        {
            Code = code.Trim().ToUpper(),
            Type = type,
            Value = value,
            Description = description?.Trim(),
            MinOrderAmount = minOrderAmount,
            MaxDiscountAmount = maxDiscountAmount,
            UsageLimit = usageLimit,
            StartsAt = startsAt,
            ExpiresAt = expiresAt,
            Status = VoucherStatus.Active,
            IsPublic = isPublic,
            UsageCount = 0,
        };

    public decimal CalculateDiscount(decimal orderAmount)
    {
        if (!IsValid(orderAmount)) return 0;
        var discount = Type == VoucherType.Percentage
            ? orderAmount * Value / 100
            : Value;
        if (MaxDiscountAmount.HasValue && discount > MaxDiscountAmount.Value)
            discount = MaxDiscountAmount.Value;
        return Math.Min(discount, orderAmount);
    }

    public bool IsValid(decimal orderAmount)
    {
        if (Status != VoucherStatus.Active) return false;
        if (ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt.Value) return false;
        if (StartsAt.HasValue && DateTime.UtcNow < StartsAt.Value) return false;
        if (UsageLimit.HasValue && UsageCount >= UsageLimit.Value) return false;
        if (MinOrderAmount.HasValue && orderAmount < MinOrderAmount.Value) return false;
        return true;
    }

    public void Use() { UsageCount++; SetUpdatedAt(); }

    public void Update(
        string? description,
        VoucherType type,
        decimal value,
        decimal? minOrderAmount,
        decimal? maxDiscountAmount,
        int? usageLimit,
        DateTime? startsAt,
        DateTime? expiresAt,
        bool isPublic)
    {
        Description = description?.Trim();
        Type = type;
        Value = value;
        MinOrderAmount = minOrderAmount;
        MaxDiscountAmount = maxDiscountAmount;
        UsageLimit = usageLimit;
        StartsAt = startsAt;
        ExpiresAt = expiresAt;
        IsPublic = isPublic;
        SetUpdatedAt();
    }

    public void Activate() { Status = VoucherStatus.Active; SetUpdatedAt(); }
    public void Deactivate() { Status = VoucherStatus.Inactive; SetUpdatedAt(); }
}
