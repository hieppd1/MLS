using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.System;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record BannerSlideDto(
    Guid Id,
    string Title,
    string? Subtitle,
    string? Description,
    string? ImageUrl,
    string? LinkUrl,
    string? BadgeText,
    string? CtaText,
    string? BgColor,
    string? TextColor,
    int OrderIndex,
    bool IsActive);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetBannerSlidesQuery(bool ActiveOnly = false) : IRequest<List<BannerSlideDto>>;

public class GetBannerSlidesHandler(IApplicationDbContext db)
    : IRequestHandler<GetBannerSlidesQuery, List<BannerSlideDto>>
{
    public async Task<List<BannerSlideDto>> Handle(GetBannerSlidesQuery q, CancellationToken ct)
    {
        var query = db.BannerSlides.AsNoTracking();
        if (q.ActiveOnly) query = query.Where(b => b.IsActive);
        return await query
            .OrderBy(b => b.OrderIndex)
            .Select(b => new BannerSlideDto(
                b.Id, b.Title, b.Subtitle, b.Description,
                b.ImageUrl, b.LinkUrl, b.BadgeText, b.CtaText,
                b.BgColor, b.TextColor, b.OrderIndex, b.IsActive))
            .ToListAsync(ct);
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateBannerSlideCommand(
    string Title, string? Subtitle, string? Description,
    string? ImageUrl, string? LinkUrl, string? BadgeText,
    string? CtaText, string? BgColor, string? TextColor,
    int OrderIndex) : IRequest<Guid>;

public class CreateBannerSlideHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBannerSlideCommand, Guid>
{
    public async Task<Guid> Handle(CreateBannerSlideCommand cmd, CancellationToken ct)
    {
        var slide = BannerSlide.Create(
            cmd.Title, cmd.Subtitle, cmd.Description,
            cmd.ImageUrl, cmd.LinkUrl, cmd.BadgeText,
            cmd.CtaText, cmd.BgColor, cmd.TextColor, cmd.OrderIndex);
        db.BannerSlides.Add(slide);
        await db.SaveChangesAsync(ct);
        return slide.Id;
    }
}

public record UpdateBannerSlideCommand(
    Guid Id,
    string Title, string? Subtitle, string? Description,
    string? ImageUrl, string? LinkUrl, string? BadgeText,
    string? CtaText, string? BgColor, string? TextColor,
    int OrderIndex, bool IsActive) : IRequest;

public class UpdateBannerSlideHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateBannerSlideCommand>
{
    public async Task Handle(UpdateBannerSlideCommand cmd, CancellationToken ct)
    {
        var slide = await db.BannerSlides.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException($"Banner slide {cmd.Id} not found");
        slide.Update(cmd.Title, cmd.Subtitle, cmd.Description,
            cmd.ImageUrl, cmd.LinkUrl, cmd.BadgeText,
            cmd.CtaText, cmd.BgColor, cmd.TextColor,
            cmd.OrderIndex, cmd.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteBannerSlideCommand(Guid Id) : IRequest;

public class DeleteBannerSlideHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteBannerSlideCommand>
{
    public async Task Handle(DeleteBannerSlideCommand cmd, CancellationToken ct)
    {
        var slide = await db.BannerSlides.FindAsync([cmd.Id], ct);
        if (slide != null)
        {
            db.BannerSlides.Remove(slide);
            await db.SaveChangesAsync(ct);
        }
    }
}
