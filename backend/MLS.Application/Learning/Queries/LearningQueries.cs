using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Learning.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record PublicCourseListItem(
    Guid Id,
    string Title,
    string? Description,
    string? ShortDescription,
    int Level,
    string? ThumbnailUrl,
    string? Slug,
    int ModuleCount,
    int SessionCount,
    bool IsEnrolled,
    bool IsFree,
    decimal Price,
    decimal? DiscountPrice);

public record PublicCoursesResult(
    IReadOnlyList<PublicCourseListItem> Items,
    int Total,
    int Page,
    int PageSize);

public record PublicLessonItem(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsFreeTrial,
    bool IsLocked,
    string? VideoStatus,
    int DurationSeconds,
    bool IsCompleted = false);

public record PublicSessionItem(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    bool IsFreeTrial,
    bool IsLocked,
    int DurationSeconds,
    int SegmentCount);

public record PublicModuleItem(
    Guid Id,
    string Title,
    string? Description,
    int OrderIndex,
    IReadOnlyList<PublicSessionItem> Sessions);

public record PublicCourseDetail(
    Guid Id,
    string Title,
    string? Description,
    string? ShortDescription,
    int Level,
    string? ThumbnailUrl,
    string? BannerUrl,
    string? Slug,
    string? TeacherName,
    DateTime? PublishedAt,
    bool IsEnrolled,
    bool IsFree,
    bool CertificateEnabled,
    IReadOnlyList<PublicModuleItem> Modules,
    decimal Price,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    string? Language = null,
    string? Tags = null,
    string? Outcomes = null,
    string? Requirements = null,
    string? TargetAudience = null,
    int EnrollmentCount = 0,
    int PaidEnrollmentCount = 0,
    string? TeacherDisplayName = null,
    string? TeacherAvatarUrl = null,
    string? TeacherSlug = null);

public record LessonViewDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsFreeTrial,
    int PassScore,
    bool IsLocked,
    string? VideoHlsPath,
    string? VideoStatus,
    int VideoDurationSeconds,
    string? VideoThumbnailUrl,
    IReadOnlyList<LessonDocumentPublicDto> Documents,
    LessonProgressDto? Progress,
    Guid? PrevLessonId,
    Guid? NextLessonId,
    Guid CourseId);

public record LessonDocumentPublicDto(Guid Id, string Title, string Type, long SizeBytes);
public record LessonProgressDto(string Status, int? Score, DateTime? CompletedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetPublicCoursesQuery(
    int Page = 1,
    int PageSize = 12,
    int? Level = null,
    string? Search = null,
    Guid? CurrentUserId = null) : IRequest<PublicCoursesResult>;

public record GetPublicCourseDetailQuery(
    Guid CourseId,
    Guid? CurrentUserId = null) : IRequest<PublicCourseDetail?>;

public record GetPublicLessonQuery(
    Guid LessonId,
    Guid? CurrentUserId) : IRequest<LessonViewDto?>;

public record LearningStreakDto(
    int CurrentStreak,
    int LongestStreak,
    int TotalDaysLearned,
    DateTime? LastLearningDate,
    bool LearnedToday,
    string[] ActivityDates); // ISO date strings (yyyy-MM-dd) for last 16 weeks

public record GetLearningStreakQuery(Guid UserId) : IRequest<LearningStreakDto>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class GetPublicCoursesHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublicCoursesQuery, PublicCoursesResult>
{
    public async Task<PublicCoursesResult> Handle(GetPublicCoursesQuery q, CancellationToken ct)
    {
        var query = db.Courses.AsNoTracking()
            .Where(c => c.Status == CourseStatus.Published && c.Visibility == CourseVisibility.Public);

        if (q.Level.HasValue)
            query = query.Where(c => c.Level == q.Level.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.ToLower();
            query = query.Where(c => c.Title.ToLower().Contains(s) || (c.Description != null && c.Description.ToLower().Contains(s)));
        }

        var total = await query.CountAsync(ct);

        var courses = await query
            .OrderBy(c => c.Level).ThenBy(c => c.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(c => new
            {
                c.Id, c.Title, c.Description, c.ShortDescription, c.Level, c.ThumbnailUrl, c.Slug,
                c.Price, c.DiscountPrice, c.IsFree,
                ModuleCount = c.Modules.Count(),
                SessionCount = c.Modules.SelectMany(m => m.Sessions).Count(),
            })
            .ToListAsync(ct);

        // enrollment check
        HashSet<Guid> enrolledIds = [];
        if (q.CurrentUserId.HasValue)
        {
            var uid = q.CurrentUserId.Value;
            enrolledIds = (await db.CourseEnrollments.AsNoTracking()
                .Where(e => e.UserId == uid && courses.Select(c => c.Id).Contains(e.CourseId))
                .Select(e => e.CourseId)
                .ToListAsync(ct)).ToHashSet();
        }

        var items = courses.Select(c => new PublicCourseListItem(
            c.Id, c.Title, c.Description, c.ShortDescription, c.Level, c.ThumbnailUrl, c.Slug,
            c.ModuleCount, c.SessionCount,
            enrolledIds.Contains(c.Id),
            c.IsFree, c.Price, c.DiscountPrice)).ToList();

        return new PublicCoursesResult(items, total, q.Page, q.PageSize);
    }
}

public class GetPublicCourseDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublicCourseDetailQuery, PublicCourseDetail?>
{
    public async Task<PublicCourseDetail?> Handle(GetPublicCourseDetailQuery q, CancellationToken ct)
    {
        var course = await db.Courses.AsNoTracking()
            .Where(c => c.Id == q.CourseId && c.Status == CourseStatus.Published)
            .Select(c => new { c.Id, c.Title, c.Description, c.ShortDescription, c.Level, c.ThumbnailUrl, c.BannerUrl, c.Slug, c.TeacherId, c.PublishedAt, c.Price, c.DiscountPrice, c.DiscountEndsAt, c.IsFree, c.CertificateEnabled, c.Language, c.Tags, c.Outcomes, c.Requirements, c.TargetAudience })
            .FirstOrDefaultAsync(ct);

        if (course == null) return null;

        var isEnrolled = false;
        if (q.CurrentUserId.HasValue)
        {
            isEnrolled = await db.CourseEnrollments.AsNoTracking()
                .AnyAsync(e => e.UserId == q.CurrentUserId && e.CourseId == q.CourseId, ct);
        }

        // Load completed session IDs for current user
        HashSet<Guid> completedSessionIds = [];
        if (q.CurrentUserId.HasValue)
        {
            completedSessionIds = (await db.SessionProgresses.AsNoTracking()
                .Where(p => p.UserId == q.CurrentUserId.Value
                    && p.Status == SessionProgressStatus.Completed)
                .Select(p => p.SessionId)
                .ToListAsync(ct)).ToHashSet();
        }

        // Build module+session tree
        var modules = await db.CourseModules.AsNoTracking()
            .Where(m => m.CourseId == q.CourseId)
            .OrderBy(m => m.OrderIndex)
            .Select(m => new
            {
                m.Id, m.Title, m.Description, m.OrderIndex,
                Sessions = m.Sessions
                    .Where(s => s.PublishStatus == SessionPublishStatus.Published)
                    .OrderBy(s => s.OrderIndex).Select(s => new
                    {
                        s.Id, s.Title, s.Description, s.OrderIndex, s.IsFreeTrial,
                        s.DurationSeconds,
                        SegmentCount = s.Segments.Count(),
                    }).ToList(),
            })
            .ToListAsync(ct);

        // All items in order for lock logic
        int itemIndex = 0;
        var moduleItems = modules.Select(m =>
        {
            var sessions = m.Sessions.Select(s =>
            {
                bool isLocked = !isEnrolled && !s.IsFreeTrial && itemIndex > 0;
                bool isCompleted = completedSessionIds.Contains(s.Id);
                itemIndex++;
                return new PublicSessionItem(
                    s.Id, s.Title, s.Description, s.OrderIndex,
                    s.IsFreeTrial, isLocked, s.DurationSeconds, s.SegmentCount);
            }).ToList();

            return new PublicModuleItem(m.Id, m.Title, m.Description, m.OrderIndex, sessions);
        }).ToList();

        var enrollmentCount = await db.CourseEnrollments.AsNoTracking()
            .CountAsync(e => e.CourseId == q.CourseId, ct);

        var paidEnrollmentCount = await db.CourseEnrollments.AsNoTracking()
            .CountAsync(e => e.CourseId == q.CourseId && e.Source == EnrollmentSource.Payment, ct);

        string? teacherDisplayName = null;
        string? teacherAvatarUrl = null;
        string? teacherSlug = null;
        if (course.TeacherId.HasValue)
        {
            var teacher = await db.TeacherProfiles.AsNoTracking()
                .Where(t => t.Id == course.TeacherId.Value)
                .Select(t => new { t.DisplayName, t.AvatarUrl, t.Slug })
                .FirstOrDefaultAsync(ct);
            if (teacher != null)
            {
                teacherDisplayName = teacher.DisplayName;
                teacherAvatarUrl = teacher.AvatarUrl;
                teacherSlug = teacher.Slug;
            }
        }

        return new PublicCourseDetail(
            course.Id, course.Title, course.Description, course.ShortDescription, course.Level,
            course.ThumbnailUrl, course.BannerUrl, course.Slug, null, course.PublishedAt, isEnrolled,
            course.IsFree, course.CertificateEnabled, moduleItems,
            course.Price, course.DiscountPrice, course.DiscountEndsAt,
            course.Language, course.Tags, course.Outcomes, course.Requirements, course.TargetAudience,
            enrollmentCount,
            PaidEnrollmentCount: paidEnrollmentCount,
            TeacherDisplayName: teacherDisplayName,
            TeacherAvatarUrl: teacherAvatarUrl,
            TeacherSlug: teacherSlug);
    }
}

// ── Learning Streak ───────────────────────────────────────────────────────────

public class GetLearningStreakHandler(IApplicationDbContext db)
    : IRequestHandler<GetLearningStreakQuery, LearningStreakDto>
{
    public async Task<LearningStreakDto> Handle(GetLearningStreakQuery q, CancellationToken ct)
    {
        // Get distinct UTC dates the user completed at least one session
        var learningDates = await db.SessionProgresses.AsNoTracking()
            .Where(p => p.UserId == q.UserId && p.CompletedAt != null)
            .Select(p => p.CompletedAt!.Value.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToListAsync(ct);

        if (learningDates.Count == 0)
            return new LearningStreakDto(0, 0, 0, null, false, []);

        var today = DateTime.UtcNow.Date;
        var learnedToday = learningDates.Contains(today);

        // Current streak: consecutive days ending today or yesterday
        int currentStreak = 0;
        var checkDate = learnedToday ? today : today.AddDays(-1);
        foreach (var date in learningDates)
        {
            if (date == checkDate)
            {
                currentStreak++;
                checkDate = checkDate.AddDays(-1);
            }
            else if (date < checkDate) break;
        }

        // Longest streak
        int longestStreak = 0, tempStreak = 1;
        for (int i = 1; i < learningDates.Count; i++)
        {
            if ((learningDates[i - 1] - learningDates[i]).Days == 1)
            {
                tempStreak++;
                longestStreak = Math.Max(longestStreak, tempStreak);
            }
            else
            {
                longestStreak = Math.Max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.Max(longestStreak, tempStreak);
        longestStreak = Math.Max(longestStreak, currentStreak);

        // Activity dates for the last 16 weeks (112 days)
        var cutoff = today.AddDays(-111);
        var recentDates = learningDates
            .Where(d => d >= cutoff)
            .Select(d => d.ToString("yyyy-MM-dd"))
            .ToArray();

        return new LearningStreakDto(
            currentStreak,
            longestStreak,
            learningDates.Count,
            learningDates.FirstOrDefault(),
            learnedToday,
            recentDates);
    }
}

// ── Get Asset Quiz (public — strips correct answers) ──────────────────────────

public record QuizQuestionPublicDto(string Text, string Type, IList<string> Options);
public record QuizPublicDto(int PassScore, int? TimeLimit, IList<QuizQuestionPublicDto> Questions);
public record GetAssetQuizQuery(Guid AssetId) : IRequest<QuizPublicDto?>;

public class GetAssetQuizQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAssetQuizQuery, QuizPublicDto?>
{
    public async Task<QuizPublicDto?> Handle(GetAssetQuizQuery request, CancellationToken ct)
    {
        var asset = await db.LearningAssets.FindAsync([request.AssetId], ct);
        if (asset == null || asset.Type != LearningAssetType.QuizBlock) return null;

        using var doc = System.Text.Json.JsonDocument.Parse(asset.Metadata ?? "{}");
        var root = doc.RootElement;

        var passScore = root.TryGetProperty("passScore", out var ps) && ps.TryGetInt32(out var psVal) ? psVal : 70;
        int? timeLimit = root.TryGetProperty("timeLimit", out var tl) && tl.TryGetInt32(out var tlVal) ? tlVal : null;

        var questions = new List<QuizQuestionPublicDto>();
        if (root.TryGetProperty("questions", out var qArr) && qArr.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var q in qArr.EnumerateArray())
            {
                var text = q.TryGetProperty("text", out var t) ? t.GetString() ?? "" : "";
                var type = q.TryGetProperty("type", out var ty) ? ty.GetString() ?? "MCQ" : "MCQ";
                var opts = new List<string>();
                if (q.TryGetProperty("options", out var opArr) && opArr.ValueKind == System.Text.Json.JsonValueKind.Array)
                    foreach (var o in opArr.EnumerateArray())
                        opts.Add(o.GetString() ?? "");
                questions.Add(new QuizQuestionPublicDto(text, type, opts));
            }
        }

        return new QuizPublicDto(passScore, timeLimit, questions);
    }
}
