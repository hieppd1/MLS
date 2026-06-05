using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Packages;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PackageEntitlementDto(Guid Id, string FeatureCode, bool Enabled);

public record PackageDto(
    Guid Id,
    Guid CourseId,
    string PackageType,
    string Title,
    string? Description,
    decimal OriginalPrice,
    decimal SalePrice,
    int DurationDay,
    string Status,
    List<PackageEntitlementDto> Entitlements);

public record StudentPackageDto(
    Guid Id,
    Guid PackageId,
    string PackageType,
    string PackageTitle,
    Guid CourseId,
    DateTime StartDate,
    DateTime? ExpiredDate,
    string Status,
    List<string> FeatureCodes);

// ── Create Package ────────────────────────────────────────────────────────────

public record CreatePackageCommand(
    Guid CourseId,
    string PackageType,
    string Title,
    string? Description,
    decimal OriginalPrice,
    decimal SalePrice,
    int DurationDay,
    List<PackageEntitlementInput> Entitlements) : IRequest<PackageDto>;

public record PackageEntitlementInput(string FeatureCode, bool Enabled);

public class CreatePackageHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePackageCommand, PackageDto>
{
    public async Task<PackageDto> Handle(CreatePackageCommand cmd, CancellationToken ct)
    {
        if (!Enum.TryParse<PackageType>(cmd.PackageType, true, out var pkgType))
            throw new DomainException($"Invalid package type: {cmd.PackageType}");

        var exists = await db.CoursePackages
            .AnyAsync(p => p.CourseId == cmd.CourseId && p.PackageType == pkgType, ct);
        if (exists) throw new ConflictException($"A {pkgType} package already exists for this course.");

        var pkg = CoursePackage.Create(cmd.CourseId, pkgType, cmd.Title, cmd.Description,
            cmd.OriginalPrice, cmd.SalePrice, cmd.DurationDay);

        db.CoursePackages.Add(pkg);
        await db.SaveChangesAsync(ct);

        foreach (var e in cmd.Entitlements)
        {
            db.PackageEntitlements.Add(PackageEntitlement.Create(pkg.Id, e.FeatureCode, e.Enabled));
        }
        await db.SaveChangesAsync(ct);

        return await GetPackageDtoAsync(pkg.Id, ct);
    }

    internal async Task<PackageDto> GetPackageDtoAsync(Guid id, CancellationToken ct)
    {
        var pkg = await db.CoursePackages
            .Include(p => p.Entitlements)
            .FirstAsync(p => p.Id == id, ct);
        return MapDto(pkg);
    }

    internal static PackageDto MapDto(CoursePackage p) =>
        new(p.Id, p.CourseId, p.PackageType.ToString(), p.Title, p.Description,
            p.OriginalPrice, p.SalePrice, p.DurationDay, p.Status.ToString(),
            p.Entitlements.Select(e => new PackageEntitlementDto(e.Id, e.FeatureCode, e.Enabled)).ToList());
}

// ── Update Package ────────────────────────────────────────────────────────────

public record UpdatePackageCommand(
    Guid PackageId,
    string Title,
    string? Description,
    decimal OriginalPrice,
    decimal SalePrice,
    int DurationDay,
    List<PackageEntitlementInput> Entitlements) : IRequest<PackageDto>;

public class UpdatePackageHandler(IApplicationDbContext db)
    : IRequestHandler<UpdatePackageCommand, PackageDto>
{
    public async Task<PackageDto> Handle(UpdatePackageCommand cmd, CancellationToken ct)
    {
        var pkg = await db.CoursePackages
            .Include(p => p.Entitlements)
            .FirstOrDefaultAsync(p => p.Id == cmd.PackageId, ct)
            ?? throw new NotFoundException("CoursePackage", cmd.PackageId);

        pkg.Update(cmd.Title, cmd.Description, cmd.OriginalPrice, cmd.SalePrice, cmd.DurationDay);

        // Sync entitlements
        foreach (var input in cmd.Entitlements)
        {
            var existing = pkg.Entitlements.FirstOrDefault(e => e.FeatureCode == input.FeatureCode.ToLowerInvariant());
            if (existing != null) existing.SetEnabled(input.Enabled);
            else db.PackageEntitlements.Add(PackageEntitlement.Create(pkg.Id, input.FeatureCode, input.Enabled));
        }

        await db.SaveChangesAsync(ct);
        return CreatePackageHandler.MapDto(await db.CoursePackages
            .Include(p => p.Entitlements)
            .FirstAsync(p => p.Id == pkg.Id, ct));
    }
}

// ── Activate / Archive Package ────────────────────────────────────────────────

public record ActivatePackageCommand(Guid PackageId) : IRequest<Unit>;
public record ArchivePackageCommand(Guid PackageId) : IRequest<Unit>;

public class ActivatePackageHandler(IApplicationDbContext db)
    : IRequestHandler<ActivatePackageCommand, Unit>
{
    public async Task<Unit> Handle(ActivatePackageCommand cmd, CancellationToken ct)
    {
        var pkg = await db.CoursePackages.FindAsync([cmd.PackageId], ct)
            ?? throw new NotFoundException("CoursePackage", cmd.PackageId);
        pkg.Activate();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ArchivePackageHandler(IApplicationDbContext db)
    : IRequestHandler<ArchivePackageCommand, Unit>
{
    public async Task<Unit> Handle(ArchivePackageCommand cmd, CancellationToken ct)
    {
        var pkg = await db.CoursePackages.FindAsync([cmd.PackageId], ct)
            ?? throw new NotFoundException("CoursePackage", cmd.PackageId);
        pkg.Archive();
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Purchase Package (student) ────────────────────────────────────────────────

public record PurchasePackageCommand(Guid StudentId, Guid PackageId) : IRequest<StudentPackageDto>;

public class PurchasePackageHandler(IApplicationDbContext db)
    : IRequestHandler<PurchasePackageCommand, StudentPackageDto>
{
    public async Task<StudentPackageDto> Handle(PurchasePackageCommand cmd, CancellationToken ct)
    {
        var pkg = await db.CoursePackages
            .Include(p => p.Entitlements)
            .FirstOrDefaultAsync(p => p.Id == cmd.PackageId && p.Status == PackageStatus.Active, ct)
            ?? throw new NotFoundException("CoursePackage", cmd.PackageId);

        // Check for existing active package of same type for same course
        var existing = await db.StudentPackages
            .Include(sp => sp.Package)
            .FirstOrDefaultAsync(sp =>
                sp.StudentId == cmd.StudentId
                && sp.Package.CourseId == pkg.CourseId
                && sp.Package.PackageType == pkg.PackageType
                && sp.Status == StudentPackageStatus.Active, ct);

        if (existing != null) throw new ConflictException("You already have an active package of this type.");

        var studentPkg = StudentPackage.Purchase(cmd.StudentId, cmd.PackageId, pkg.DurationDay);
        db.StudentPackages.Add(studentPkg);
        await db.SaveChangesAsync(ct);

        return MapStudentPackageDto(studentPkg, pkg);
    }

    internal static StudentPackageDto MapStudentPackageDto(StudentPackage sp, CoursePackage pkg) =>
        new(sp.Id, sp.PackageId, pkg.PackageType.ToString(), pkg.Title, pkg.CourseId,
            sp.StartDate, sp.ExpiredDate, sp.Status.ToString(),
            pkg.Entitlements.Where(e => e.Enabled).Select(e => e.FeatureCode).ToList());
}
