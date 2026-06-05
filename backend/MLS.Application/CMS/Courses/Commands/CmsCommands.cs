using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Courses.Commands;

// ── Course ────────────────────────────────────────────────────────────────────

public record CreateCourseCommand(
    string Title,
    string? Description,
    int Level,
    Guid? TeacherId,
    Guid CreatedBy,
    decimal Price = 0,
    decimal? DiscountPrice = null,
    DateTime? DiscountEndsAt = null,
    string? ShortDescription = null,
    bool IsFree = false,
    bool CertificateEnabled = false,
    string Visibility = "Public",
    string? Code = null,
    string? Language = "VI",
    string? ThumbnailUrl = null,
    string? BannerUrl = null,
    string? Tags = null,
    int? Duration = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    bool CompletionRequired = false,
    string? Outcomes = null,
    string? Requirements = null,
    string? TargetAudience = null
) : IRequest<Guid>;

public class CreateCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateCourseCommand, Guid>
{
    public async Task<Guid> Handle(CreateCourseCommand request, CancellationToken ct)
    {
        var visibility = Enum.TryParse<CourseVisibility>(request.Visibility, out var v) ? v : CourseVisibility.Public;
        var course = Course.Create(request.Title, request.Description, request.Level, request.CreatedBy, request.TeacherId,
            request.Price, request.DiscountPrice, request.DiscountEndsAt,
            request.ShortDescription, request.IsFree, request.CertificateEnabled, visibility,
            request.Code, request.Language, request.BannerUrl, request.Tags,
            request.Duration, request.StartDate, request.EndDate, request.CompletionRequired,
            request.Outcomes, request.Requirements, request.TargetAudience);
        if (request.ThumbnailUrl != null) course.SetThumbnail(request.ThumbnailUrl);
        db.Courses.Add(course);
        await db.SaveChangesAsync(ct);

        // Auto-provision 3 default packages (all Draft — admin can edit prices before activating)
        await SeedDefaultPackagesAsync(db, course.Id, ct);

        return course.Id;
    }

    private static readonly (PackageType Type, string Title, string Desc, decimal OrigPrice, decimal SalePrice, int DurationDay, (string Code, bool Enabled)[] Features)[] DefaultPackageTemplates =
    [
        (PackageType.Basic, "Gói Cơ Bản", "Khóa học cơ bản, có thể phát hoặc bán free", 0, 0, 0,
            [("video_learning", true), ("basic_quiz", true), ("vocabulary_package", false),
             ("grammar_practice", false), ("realtime_comments", false),
             ("speaking_ai", false), ("writing_ai", false), ("teacher_support", false)]),
        (PackageType.Standard, "Gói Tiêu Chuẩn", "Combo 3 bộ sách (từ vựng, ngữ pháp, luyện tập)", 0, 0, 365,
            [("video_learning", true), ("basic_quiz", true), ("vocabulary_package", true),
             ("grammar_practice", true), ("realtime_comments", true),
             ("speaking_ai", false), ("writing_ai", false), ("teacher_support", false)]),
        (PackageType.Advance, "Gói Nâng Cao", "Combo 3 bộ sách + học thực hành (AI + giáo viên 1-1)", 0, 0, 365,
            [("video_learning", true), ("basic_quiz", true), ("vocabulary_package", true),
             ("grammar_practice", true), ("realtime_comments", true),
             ("speaking_ai", true), ("writing_ai", true), ("teacher_support", true)]),
    ];

    private static async Task SeedDefaultPackagesAsync(IApplicationDbContext db, Guid courseId, CancellationToken ct)
    {
        foreach (var t in DefaultPackageTemplates)
        {
            var pkg = CoursePackage.Create(courseId, t.Type, t.Title, t.Desc, t.OrigPrice, t.SalePrice, t.DurationDay);
            db.CoursePackages.Add(pkg);
            await db.SaveChangesAsync(ct);
            foreach (var (code, enabled) in t.Features)
                db.PackageEntitlements.Add(PackageEntitlement.Create(pkg.Id, code, enabled));
            await db.SaveChangesAsync(ct);
        }
    }
}

public record UpdateCourseCommand(
    Guid CourseId,
    string Title,
    string? Description,
    int Level,
    Guid? TeacherId,
    decimal Price = 0,
    decimal? DiscountPrice = null,
    DateTime? DiscountEndsAt = null,
    string? ShortDescription = null,
    bool IsFree = false,
    bool CertificateEnabled = false,
    string Visibility = "Public",
    string? ThumbnailUrl = null,
    string? BannerUrl = null,
    string? Language = null,
    string? Tags = null,
    int? Duration = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    bool CompletionRequired = false,
    string? Code = null,
    string? Outcomes = null,
    string? Requirements = null,
    string? TargetAudience = null
) : IRequest;

public class UpdateCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCourseCommand>
{
    public async Task Handle(UpdateCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        var visibility = Enum.TryParse<CourseVisibility>(request.Visibility, out var v) ? v : CourseVisibility.Public;
        course.Update(request.Title, request.Description, request.Level, request.TeacherId,
            request.Price, request.DiscountPrice, request.DiscountEndsAt,
            request.ShortDescription, request.IsFree, request.CertificateEnabled, visibility,
            request.ThumbnailUrl, request.BannerUrl, request.Language,
            request.Tags, request.Duration, request.StartDate, request.EndDate, request.CompletionRequired,
            request.Code, request.Outcomes, request.Requirements, request.TargetAudience);
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteCourseCommand(Guid CourseId) : IRequest;

public class DeleteCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCourseCommand>
{
    public async Task Handle(DeleteCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        db.Courses.Remove(course);
        await db.SaveChangesAsync(ct);
    }
}

public record PublishCourseCommand(Guid CourseId, bool Approve) : IRequest;

public class PublishCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<PublishCourseCommand>
{
    public async Task Handle(PublishCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        if (request.Approve) course.Publish();
        else course.Reject();
        await db.SaveChangesAsync(ct);
    }
}

public record HideCourseCommand(Guid CourseId) : IRequest;

public class HideCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<HideCourseCommand>
{
    public async Task Handle(HideCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        course.Hide();
        await db.SaveChangesAsync(ct);
    }
}

public record ArchiveCourseCommand(Guid CourseId) : IRequest;

public class ArchiveCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ArchiveCourseCommand>
{
    public async Task Handle(ArchiveCourseCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        course.Archive();
        await db.SaveChangesAsync(ct);
    }
}

public record CloneCourseCommand(Guid CourseId, Guid CreatedBy) : IRequest<Guid>;

public class CloneCourseCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CloneCourseCommand, Guid>
{
    public async Task<Guid> Handle(CloneCourseCommand request, CancellationToken ct)
    {
        var original = await db.Courses
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
                .ThenInclude(m => m.Sessions.OrderBy(s => s.OrderIndex))
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);

        var clone = original.CloneAs(request.CreatedBy);
        db.Courses.Add(clone);
        await db.SaveChangesAsync(ct);
        return clone.Id;
    }
}

// ── Module ────────────────────────────────────────────────────────────────────

public record CreateModuleCommand(
    Guid CourseId,
    string Title,
    string? Description,
    Guid? LevelId = null,
    string? ThumbnailUrl = null,
    int EstimatedDuration = 0
) : IRequest<Guid>;

public class CreateModuleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateModuleCommand, Guid>
{
    public async Task<Guid> Handle(CreateModuleCommand request, CancellationToken ct)
    {
        // Auto-determine next OrderIndex
        var maxOrder = await db.CourseModules
            .Where(m => m.CourseId == request.CourseId)
            .Select(m => (int?)m.OrderIndex)
            .MaxAsync(ct) ?? -1;

        var module = CourseModule.Create(request.CourseId, request.Title, request.Description, maxOrder + 1, request.LevelId);
        if (request.ThumbnailUrl != null || request.EstimatedDuration > 0)
            module.Update(request.Title, request.Description, maxOrder + 1, false, request.LevelId, request.ThumbnailUrl, request.EstimatedDuration);
        db.CourseModules.Add(module);
        await db.SaveChangesAsync(ct);
        return module.Id;
    }
}

public record UpdateModuleCommand(
    Guid ModuleId,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsLocked = false,
    Guid? LevelId = null,
    string? ThumbnailUrl = null,
    int EstimatedDuration = 0
) : IRequest;

public class UpdateModuleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateModuleCommand>
{
    public async Task Handle(UpdateModuleCommand request, CancellationToken ct)
    {
        var module = await db.CourseModules.FirstOrDefaultAsync(m => m.Id == request.ModuleId, ct)
            ?? throw new NotFoundException("CourseModule", request.ModuleId);
        module.Update(request.Title, request.Description, request.OrderIndex, request.IsLocked, request.LevelId, request.ThumbnailUrl, request.EstimatedDuration);
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteModuleCommand(Guid ModuleId) : IRequest;

public class DeleteModuleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteModuleCommand>
{
    public async Task Handle(DeleteModuleCommand request, CancellationToken ct)
    {
        var module = await db.CourseModules.FirstOrDefaultAsync(m => m.Id == request.ModuleId, ct)
            ?? throw new NotFoundException("CourseModule", request.ModuleId);
        db.CourseModules.Remove(module);
        await db.SaveChangesAsync(ct);
    }
}

// ── Level ─────────────────────────────────────────────────────────────────────

public record CreateLevelCommand(Guid CourseId, string Name, string? Description) : IRequest<Guid>;

public class CreateLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLevelCommand, Guid>
{
    public async Task<Guid> Handle(CreateLevelCommand request, CancellationToken ct)
    {
        var maxOrder = await db.CourseLevels
            .Where(lv => lv.CourseId == request.CourseId)
            .Select(lv => (int?)lv.OrderIndex)
            .MaxAsync(ct) ?? -1;

        var level = CourseLevel.Create(request.CourseId, request.Name, request.Description, maxOrder + 1);
        db.CourseLevels.Add(level);
        await db.SaveChangesAsync(ct);
        return level.Id;
    }
}

public record UpdateLevelCommand(Guid LevelId, string Name, string? Description, int OrderIndex) : IRequest;

public class UpdateLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateLevelCommand>
{
    public async Task Handle(UpdateLevelCommand request, CancellationToken ct)
    {
        var level = await db.CourseLevels.FirstOrDefaultAsync(lv => lv.Id == request.LevelId, ct)
            ?? throw new NotFoundException("CourseLevel", request.LevelId);
        level.Update(request.Name, request.Description, request.OrderIndex);
        await db.SaveChangesAsync(ct);
    }
}

public record PublishLevelCommand(Guid LevelId, bool Publish) : IRequest;

public class PublishLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<PublishLevelCommand>
{
    public async Task Handle(PublishLevelCommand request, CancellationToken ct)
    {
        var level = await db.CourseLevels.FirstOrDefaultAsync(lv => lv.Id == request.LevelId, ct)
            ?? throw new NotFoundException("CourseLevel", request.LevelId);
        if (request.Publish) level.Publish(); else level.Unpublish();
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteLevelCommand(Guid LevelId) : IRequest;

public class DeleteLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLevelCommand>
{
    public async Task Handle(DeleteLevelCommand request, CancellationToken ct)
    {
        var level = await db.CourseLevels.FirstOrDefaultAsync(lv => lv.Id == request.LevelId, ct)
            ?? throw new NotFoundException("CourseLevel", request.LevelId);
        var modules = await db.CourseModules.Where(m => m.LevelId == request.LevelId).ToListAsync(ct);
        foreach (var m in modules)
            m.Update(m.Title, m.Description, m.OrderIndex, m.IsLocked, null);
        db.CourseLevels.Remove(level);
        await db.SaveChangesAsync(ct);
    }
}

// ── Content Approval Workflow ─────────────────────────────────────────────────

public record SubmitForReviewCommand(Guid CourseId) : IRequest;

public class SubmitForReviewCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SubmitForReviewCommand>
{
    public async Task Handle(SubmitForReviewCommand request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);
        course.SubmitForReview();
        await db.SaveChangesAsync(ct);
    }
}

// ── Learning Level (global config) ──────────────────────────────────────────

public record CreateLearningLevelCommand(string Name, string? Description, int OrderIndex) : IRequest<Guid>;

public class CreateLearningLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLearningLevelCommand, Guid>
{
    public async Task<Guid> Handle(CreateLearningLevelCommand request, CancellationToken ct)
    {
        var level = LearningLevel.Create(request.Name, request.Description, request.OrderIndex);
        db.LearningLevels.Add(level);
        await db.SaveChangesAsync(ct);
        return level.Id;
    }
}

public record UpdateLearningLevelCommand(Guid Id, string Name, string? Description, int OrderIndex) : IRequest;

public class UpdateLearningLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateLearningLevelCommand>
{
    public async Task Handle(UpdateLearningLevelCommand request, CancellationToken ct)
    {
        var level = await db.LearningLevels.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("LearningLevel", request.Id);
        level.Update(request.Name, request.Description, request.OrderIndex);
        await db.SaveChangesAsync(ct);
    }
}

public record SetLearningLevelActiveCommand(Guid Id, bool IsActive) : IRequest;

public class SetLearningLevelActiveCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SetLearningLevelActiveCommand>
{
    public async Task Handle(SetLearningLevelActiveCommand request, CancellationToken ct)
    {
        var level = await db.LearningLevels.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("LearningLevel", request.Id);
        level.SetActive(request.IsActive);
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteLearningLevelCommand(Guid Id) : IRequest;

public class DeleteLearningLevelCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLearningLevelCommand>
{
    public async Task Handle(DeleteLearningLevelCommand request, CancellationToken ct)
    {
        var level = await db.LearningLevels.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("LearningLevel", request.Id);
        db.LearningLevels.Remove(level);
        await db.SaveChangesAsync(ct);
    }
}
