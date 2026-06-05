using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class BannerSlide : BaseEntity
{
    public string Title { get; private set; } = string.Empty;
    public string? Subtitle { get; private set; }
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? LinkUrl { get; private set; }
    public string? BadgeText { get; private set; }        // e.g. "GIẢM 300K"
    public string? CtaText { get; private set; }          // e.g. "Đăng ký ngay"
    public string? BgColor { get; private set; }          // e.g. "#1565C0"
    public string? TextColor { get; private set; }        // e.g. "#FFFFFF"
    public int OrderIndex { get; private set; }
    public bool IsActive { get; private set; } = true;

    private BannerSlide() { }

    public static BannerSlide Create(
        string title, string? subtitle, string? description,
        string? imageUrl, string? linkUrl, string? badgeText,
        string? ctaText, string? bgColor, string? textColor, int orderIndex)
    {
        return new BannerSlide
        {
            Title = title,
            Subtitle = subtitle,
            Description = description,
            ImageUrl = imageUrl,
            LinkUrl = linkUrl,
            BadgeText = badgeText,
            CtaText = ctaText,
            BgColor = bgColor,
            TextColor = textColor,
            OrderIndex = orderIndex,
            IsActive = true,
        };
    }

    public void Update(
        string title, string? subtitle, string? description,
        string? imageUrl, string? linkUrl, string? badgeText,
        string? ctaText, string? bgColor, string? textColor,
        int orderIndex, bool isActive)
    {
        Title = title;
        Subtitle = subtitle;
        Description = description;
        ImageUrl = imageUrl;
        LinkUrl = linkUrl;
        BadgeText = badgeText;
        CtaText = ctaText;
        BgColor = bgColor;
        TextColor = textColor;
        OrderIndex = orderIndex;
        IsActive = isActive;
        SetUpdatedAt();
    }
}
