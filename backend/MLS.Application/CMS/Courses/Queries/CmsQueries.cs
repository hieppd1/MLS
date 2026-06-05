using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using System.Globalization;

namespace MLS.Application.CMS.Courses.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record CourseListItemDto(
    Guid Id,
    string Title,
    string? Description,
    string? ShortDescription,
    int Level,
    string? ThumbnailUrl,
    string? Slug,
    string Status,
    string Visibility,
    bool IsFree,
    bool CertificateEnabled,
    int ModuleCount,
    int EnrollmentCount,
    DateTime CreatedAt,
    decimal Price,
    decimal? DiscountPrice,
    string? Code,
    string? Language,
    string? BannerUrl,
    string? Tags
);

public record CourseDetailDto(
    Guid Id,
    string Title,
    string? Description,
    string? ShortDescription,
    int Level,
    string? ThumbnailUrl,
    string? Slug,
    string Status,
    string Visibility,
    bool IsFree,
    bool CertificateEnabled,
    bool CompletionRequired,
    Guid? TeacherId,
    Guid CreatedBy,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    List<CourseLevelDto> Levels,
    List<ModuleSummaryDto> Modules,
    decimal Price,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    string? Code,
    string? Language,
    string? BannerUrl,
    string? Tags,
    int? Duration,
    DateTime? StartDate,
    DateTime? EndDate,
    string? Outcomes,
    string? Requirements,
    string? TargetAudience
);

public record ModuleSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    int SessionCount,
    Guid? LevelId
);

public record CourseLevelDto(
    Guid Id,
    Guid CourseId,
    string Name,
    string? Description,
    int OrderIndex,
    bool IsPublished,
    int ModuleCount,
    DateTime CreatedAt
);

public record LevelDetailDto(
    Guid Id,
    Guid CourseId,
    string Name,
    string? Description,
    int OrderIndex,
    bool IsPublished,
    DateTime CreatedAt,
    List<ModuleSummaryDto> Modules
);

public record ModuleDetailDto(
    Guid Id,
    Guid CourseId,
    string Title,
    string? Description,
    string? ThumbnailUrl,
    int EstimatedDuration,
    int OrderIndex,
    bool IsLocked,
    DateTime CreatedAt,
    List<SessionSummaryInModuleDto> Sessions
);

public record SessionSummaryInModuleDto(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsFreeTrial,
    string SessionType,
    string PublishStatus,
    string? ThumbnailUrl,
    int DurationSeconds,
    int DurationMinutes,
    string? VideoStatus
);

// ── List Courses ─────────────────────────────────────────────────────────────

public record GetCoursesQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    int? Level = null,
    string? Status = null
) : IRequest<PagedCoursesResult>;

public record PagedCoursesResult(List<CourseListItemDto> Items, int Total, int Page, int PageSize);

public class GetCoursesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCoursesQuery, PagedCoursesResult>
{
    public async Task<PagedCoursesResult> Handle(GetCoursesQuery request, CancellationToken ct)
    {
        var query = db.Courses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(c => c.Title.ToLower().Contains(s));
        }

        if (request.Level.HasValue)
            query = query.Where(c => c.Level == request.Level.Value);

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<CourseStatus>(request.Status, out var status))
            query = query.Where(c => c.Status == status);

        var total = await query.CountAsync(ct);

        var courses = await query
            .Include(c => c.Modules)
            .Include(c => c.Enrollments)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        var items = courses.Select(c => new CourseListItemDto(
            c.Id, c.Title, c.Description, c.ShortDescription, c.Level, c.ThumbnailUrl, c.Slug,
            c.Status.ToString(), c.Visibility.ToString(), c.IsFree, c.CertificateEnabled,
            c.Modules.Count,
            c.Enrollments.Count,
            c.CreatedAt,
            c.Price,
            c.DiscountPrice,
            c.Code, c.Language, c.BannerUrl, c.Tags
        )).ToList();

        return new PagedCoursesResult(items, total, request.Page, request.PageSize);
    }
}

// ── Get Course Detail ─────────────────────────────────────────────────────────

public record GetCourseDetailQuery(Guid CourseId) : IRequest<CourseDetailDto>;

public class GetCourseDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseDetailQuery, CourseDetailDto>
{
    public async Task<CourseDetailDto> Handle(GetCourseDetailQuery request, CancellationToken ct)
    {
        var course = await db.Courses
            .Include(c => c.Levels.OrderBy(lv => lv.OrderIndex))
            .Include(c => c.Modules.OrderBy(m => m.OrderIndex))
                .ThenInclude(m => m.Sessions)
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course", request.CourseId);

        // III-4: apply i18n translation (fallback chain: ko → en → vi)
        var locale = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        var chain = locale switch
        {
            "ko" => new[] { "ko", "en" },
            "en" => new[] { "en" },
            _    => System.Array.Empty<string>()
        };
        var translations = chain.Length > 0
            ? await db.CourseTranslations
                .Where(t => t.CourseId == course.Id && chain.Contains(t.Locale))
                .ToListAsync(ct)
            : new List<CourseTranslation>();
        string? Pick(System.Func<CourseTranslation, string?> sel)
        {
            foreach (var loc in chain)
            {
                var hit = translations.FirstOrDefault(t => t.Locale == loc);
                var val = hit is null ? null : sel(hit);
                if (!string.IsNullOrWhiteSpace(val)) return val;
            }
            return null;
        }
        var title            = Pick(t => t.Title)            ?? course.Title;
        var description      = Pick(t => t.Description)      ?? course.Description;
        var shortDescription = Pick(t => t.ShortDescription) ?? course.ShortDescription;
        var outcomes         = Pick(t => t.Outcomes)         ?? course.Outcomes;
        var requirements     = Pick(t => t.Requirements)     ?? course.Requirements;
        var targetAudience   = Pick(t => t.TargetAudience)   ?? course.TargetAudience;

        return new CourseDetailDto(
            course.Id, title, description, shortDescription, course.Level,
            course.ThumbnailUrl, course.Slug, course.Status.ToString(), course.Visibility.ToString(),
            course.IsFree, course.CertificateEnabled, course.CompletionRequired,
            course.TeacherId, course.CreatedBy, course.PublishedAt, course.CreatedAt,
            course.Levels.Select(lv => new CourseLevelDto(
                lv.Id, lv.CourseId, lv.Name, lv.Description, lv.OrderIndex, lv.IsPublished,
                course.Modules.Count(m => m.LevelId == lv.Id),
                lv.CreatedAt
            )).ToList(),
            course.Modules.Select(m => new ModuleSummaryDto(
                m.Id, m.Title, m.Description, m.OrderIndex, m.Sessions.Count, m.LevelId
            )).ToList(),
            course.Price, course.DiscountPrice, course.DiscountEndsAt,
            course.Code, course.Language, course.BannerUrl, course.Tags,
            course.Duration, course.StartDate, course.EndDate,
            outcomes, requirements, targetAudience
        );
    }
}

// ── Get Module Detail ─────────────────────────────────────────────────────────

public record GetModuleDetailQuery(Guid ModuleId) : IRequest<ModuleDetailDto>;

public class GetModuleDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetModuleDetailQuery, ModuleDetailDto>
{
    public async Task<ModuleDetailDto> Handle(GetModuleDetailQuery request, CancellationToken ct)
    {
        var module = await db.CourseModules
            .Include(m => m.Sessions.OrderBy(s => s.OrderIndex))
                .ThenInclude(s => s.VideoAsset)
            .FirstOrDefaultAsync(m => m.Id == request.ModuleId, ct)
            ?? throw new NotFoundException("CourseModule", request.ModuleId);

        return new ModuleDetailDto(
            module.Id, module.CourseId, module.Title, module.Description,
            module.ThumbnailUrl, module.EstimatedDuration,
            module.OrderIndex, module.IsLocked, module.CreatedAt,
            module.Sessions.Select(s => new SessionSummaryInModuleDto(
                s.Id, s.Title, s.Description, s.OrderIndex, s.IsFreeTrial,
                s.SessionType.ToString(), s.PublishStatus.ToString(),
                s.ThumbnailUrl, s.DurationSeconds, s.DurationMinutes,
                s.VideoAsset?.Status.ToString()
            )).ToList()
        );
    }
}

// ── Content Approvals Queue ───────────────────────────────────────────────────

public record ApprovalQueueItem(
    Guid CourseId,
    string Title,
    int Level,
    string? ThumbnailUrl,
    Guid CreatedBy,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record GetApprovalsQueueQuery : IRequest<IReadOnlyList<ApprovalQueueItem>>;

public class GetApprovalsQueueHandler(IApplicationDbContext db)
    : IRequestHandler<GetApprovalsQueueQuery, IReadOnlyList<ApprovalQueueItem>>
{
    public async Task<IReadOnlyList<ApprovalQueueItem>> Handle(GetApprovalsQueueQuery _, CancellationToken ct)
    {
        return await db.Courses.AsNoTracking()
            .Where(c => c.Status == CourseStatus.PendingReview)
            .OrderBy(c => c.UpdatedAt)
            .Select(c => new ApprovalQueueItem(
                c.Id, c.Title, c.Level, c.ThumbnailUrl,
                c.CreatedBy, c.CreatedAt, c.UpdatedAt))
            .ToListAsync(ct);
    }
}

// ── Get Course Levels ─────────────────────────────────────────────────────────

public record GetCourseLevelsQuery(Guid CourseId) : IRequest<List<CourseLevelDto>>;

public class GetCourseLevelsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCourseLevelsQuery, List<CourseLevelDto>>
{
    public async Task<List<CourseLevelDto>> Handle(GetCourseLevelsQuery request, CancellationToken ct)
    {
        var levels = await db.CourseLevels.AsNoTracking()
            .Where(lv => lv.CourseId == request.CourseId)
            .OrderBy(lv => lv.OrderIndex)
            .ToListAsync(ct);

        var moduleCounts = await db.CourseModules.AsNoTracking()
            .Where(m => m.CourseId == request.CourseId && m.LevelId != null)
            .GroupBy(m => m.LevelId!.Value)
            .Select(g => new { LevelId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LevelId, x => x.Count, ct);

        return levels.Select(lv => new CourseLevelDto(
            lv.Id, lv.CourseId, lv.Name, lv.Description, lv.OrderIndex, lv.IsPublished,
            moduleCounts.GetValueOrDefault(lv.Id, 0),
            lv.CreatedAt
        )).ToList();
    }
}

// ── Get Level Detail ──────────────────────────────────────────────────────────

public record GetLevelDetailQuery(Guid LevelId) : IRequest<LevelDetailDto>;

public class GetLevelDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLevelDetailQuery, LevelDetailDto>
{
    public async Task<LevelDetailDto> Handle(GetLevelDetailQuery request, CancellationToken ct)
    {
        var level = await db.CourseLevels
            .FirstOrDefaultAsync(lv => lv.Id == request.LevelId, ct)
            ?? throw new NotFoundException("CourseLevel", request.LevelId);

        var modules = await db.CourseModules.AsNoTracking()
            .Include(m => m.Sessions)
            .Where(m => m.LevelId == level.Id)
            .OrderBy(m => m.OrderIndex)
            .ToListAsync(ct);

        return new LevelDetailDto(
            level.Id, level.CourseId, level.Name, level.Description,
            level.OrderIndex, level.IsPublished, level.CreatedAt,
            modules.Select(m => new ModuleSummaryDto(
                m.Id, m.Title, m.Description, m.OrderIndex, m.Sessions.Count, m.LevelId
            )).ToList()
        );
    }
}

// ── Learning Level queries ─────────────────────────────────────────────────

public record LearningLevelDto(Guid Id, string Name, string? Description, int OrderIndex, bool IsActive, DateTime CreatedAt);

public record GetLearningLevelsQuery(bool IncludeInactive = false) : IRequest<List<LearningLevelDto>>;

public class GetLearningLevelsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLearningLevelsQuery, List<LearningLevelDto>>
{
    public async Task<List<LearningLevelDto>> Handle(GetLearningLevelsQuery request, CancellationToken ct)
    {
        var query = db.LearningLevels.AsNoTracking();
        if (!request.IncludeInactive)
            query = query.Where(l => l.IsActive);
        return await query
            .OrderBy(l => l.OrderIndex)
            .Select(l => new LearningLevelDto(l.Id, l.Name, l.Description, l.OrderIndex, l.IsActive, l.CreatedAt))
            .ToListAsync(ct);
    }
}
