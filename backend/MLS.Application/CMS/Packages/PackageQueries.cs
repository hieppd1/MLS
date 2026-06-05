using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Packages;

// ── Get Packages for Course ───────────────────────────────────────────────────

public record GetCoursePackagesQuery(Guid CourseId, bool ActiveOnly = false) : IRequest<List<PackageDto>>;

public class GetCoursePackagesHandler(IApplicationDbContext db)
    : IRequestHandler<GetCoursePackagesQuery, List<PackageDto>>
{
    public async Task<List<PackageDto>> Handle(GetCoursePackagesQuery q, CancellationToken ct)
    {
        var query = db.CoursePackages
            .Include(p => p.Entitlements)
            .Where(p => p.CourseId == q.CourseId);

        if (q.ActiveOnly)
            query = query.Where(p => p.Status == PackageStatus.Active);

        var packages = await query.OrderBy(p => p.PackageType).ToListAsync(ct);
        return packages.Select(CreatePackageHandler.MapDto).ToList();
    }
}

// ── Get Single Package ────────────────────────────────────────────────────────

public record GetPackageByIdQuery(Guid PackageId) : IRequest<PackageDto>;

public class GetPackageByIdHandler(IApplicationDbContext db)
    : IRequestHandler<GetPackageByIdQuery, PackageDto>
{
    public async Task<PackageDto> Handle(GetPackageByIdQuery q, CancellationToken ct)
    {
        var pkg = await db.CoursePackages
            .Include(p => p.Entitlements)
            .FirstOrDefaultAsync(p => p.Id == q.PackageId, ct)
            ?? throw new NotFoundException("CoursePackage", q.PackageId);

        return CreatePackageHandler.MapDto(pkg);
    }
}

// ── Get Student Packages ──────────────────────────────────────────────────────

public record GetMyPackagesQuery(Guid StudentId, Guid? CourseId = null) : IRequest<List<StudentPackageDto>>;

public class GetMyPackagesHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyPackagesQuery, List<StudentPackageDto>>
{
    public async Task<List<StudentPackageDto>> Handle(GetMyPackagesQuery q, CancellationToken ct)
    {
        var query = db.StudentPackages
            .Include(sp => sp.Package).ThenInclude(p => p.Entitlements)
            .Where(sp => sp.StudentId == q.StudentId && sp.Status == StudentPackageStatus.Active);

        if (q.CourseId.HasValue)
            query = query.Where(sp => sp.Package.CourseId == q.CourseId.Value);

        var packages = await query.ToListAsync(ct);
        return packages.Select(sp => PurchasePackageHandler.MapStudentPackageDto(sp, sp.Package)).ToList();
    }
}

// ── Check Feature Access ──────────────────────────────────────────────────────

public record CheckFeatureAccessQuery(
    Guid StudentId,
    Guid CourseId,
    string FeatureCode) : IRequest<FeatureAccessDto>;

public record FeatureAccessDto(bool HasAccess, string? PackageType, DateTime? ExpiresAt);

public class CheckFeatureAccessHandler(IApplicationDbContext db)
    : IRequestHandler<CheckFeatureAccessQuery, FeatureAccessDto>
{
    public async Task<FeatureAccessDto> Handle(CheckFeatureAccessQuery q, CancellationToken ct)
    {
        var featureLower = q.FeatureCode.ToLowerInvariant();

        var sp = await db.StudentPackages
            .Include(sp => sp.Package).ThenInclude(p => p.Entitlements)
            .Where(sp =>
                sp.StudentId == q.StudentId
                && sp.Package.CourseId == q.CourseId
                && sp.Status == StudentPackageStatus.Active
                && (sp.ExpiredDate == null || sp.ExpiredDate > DateTime.UtcNow)
                && sp.Package.Entitlements.Any(e => e.FeatureCode == featureLower && e.Enabled))
            .OrderByDescending(sp => sp.Package.PackageType)
            .FirstOrDefaultAsync(ct);

        if (sp == null) return new FeatureAccessDto(false, null, null);

        return new FeatureAccessDto(true, sp.Package.PackageType.ToString(), sp.ExpiredDate);
    }
}
