using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Teacher.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record TeacherProfileDto(
    Guid Id,
    string DisplayName,
    string Slug,
    string? AvatarUrl,
    string? CoverUrl,
    string? Headline,
    string? Bio,
    int ExperienceYears,
    string? Specialization,
    string? FacebookUrl,
    string? YoutubeUrl,
    string? TiktokUrl,
    string? WebsiteUrl,
    bool IsVerified,
    int FollowerCount,
    int CourseCount,
    decimal RatingAverage,
    long TotalViews,
    long TotalStudents,
    bool IsFollowing);

public record TeacherCourseItem(
    Guid Id,
    string Title,
    string? ShortDescription,
    string? ThumbnailUrl,
    int Level,
    decimal Price,
    decimal? DiscountPrice,
    bool IsFree,
    string? Slug,
    int EnrollmentCount,
    decimal RatingAverage);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetTeacherBySlugQuery(string Slug, Guid? CurrentUserId) : IRequest<TeacherProfileDto?>;
public record GetTeacherCoursesQuery(Guid TeacherProfileId) : IRequest<List<TeacherCourseItem>>;
public record GetTeacherListQuery(int Page = 1, int PageSize = 20) : IRequest<List<TeacherProfileDto>>;
public record FollowTeacherCommand(Guid TeacherProfileId, Guid StudentId) : IRequest<bool>;
public record UnfollowTeacherCommand(Guid TeacherProfileId, Guid StudentId) : IRequest<bool>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetTeacherListHandler(IApplicationDbContext db)
    : IRequestHandler<GetTeacherListQuery, List<TeacherProfileDto>>
{
    public async Task<List<TeacherProfileDto>> Handle(GetTeacherListQuery q, CancellationToken ct)
    {
        // 1. Get users with Teacher role (ordered by creation date)
        var teacherUsers = await db.Users.AsNoTracking()
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Teacher")
                     && u.Status == UserStatus.Active)
            .OrderBy(u => u.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                ProfileFullName  = u.Profile == null ? null : u.Profile.FullName,
                ProfileAvatarUrl = u.Profile == null ? null : u.Profile.AvatarUrl,
            })
            .ToListAsync(ct);

        if (teacherUsers.Count == 0) return [];

        // 2. Fetch any existing TeacherProfiles for those users
        var userIds = teacherUsers.Select(u => u.Id).ToList();
        var tpMap = await db.TeacherProfiles.AsNoTracking()
            .Where(tp => userIds.Contains(tp.UserId))
            .ToDictionaryAsync(tp => tp.UserId, ct);

        // 3. Merge: prefer TeacherProfile data; fallback to UserProfile / userId-as-slug
        return teacherUsers.Select(u =>
        {
            tpMap.TryGetValue(u.Id, out var tp);
            return new TeacherProfileDto(
                tp?.Id ?? u.Id,
                tp?.DisplayName ?? u.ProfileFullName ?? u.Email,
                tp?.Slug       ?? u.Id.ToString(),
                tp?.AvatarUrl  ?? u.ProfileAvatarUrl,
                tp?.CoverUrl,
                tp?.Headline,
                tp?.Bio,
                tp?.ExperienceYears ?? 0,
                tp?.Specialization,
                tp?.FacebookUrl,
                tp?.YoutubeUrl,
                tp?.TiktokUrl,
                tp?.WebsiteUrl,
                tp?.IsVerified ?? false,
                tp?.FollowerCount ?? 0,
                tp?.CourseCount ?? 0,
                tp?.RatingAverage ?? 0,
                tp?.TotalViews ?? 0,
                tp?.TotalStudents ?? 0,
                false);
        }).ToList();
    }
}

public class GetTeacherBySlugHandler(IApplicationDbContext db)
    : IRequestHandler<GetTeacherBySlugQuery, TeacherProfileDto?>
{
    public async Task<TeacherProfileDto?> Handle(GetTeacherBySlugQuery q, CancellationToken ct)
    {
        // 1. Try to find by slug in TeacherProfiles
        var t = await db.TeacherProfiles.AsNoTracking()
            .Where(p => p.Slug == q.Slug)
            .FirstOrDefaultAsync(ct);

        if (t != null)
        {
            var isFollowing = false;
            if (q.CurrentUserId.HasValue)
                isFollowing = await db.TeacherFollowers.AsNoTracking()
                    .AnyAsync(f => f.TeacherProfileId == t.Id && f.StudentId == q.CurrentUserId.Value, ct);

            return new TeacherProfileDto(
                t.Id, t.DisplayName, t.Slug, t.AvatarUrl, t.CoverUrl,
                t.Headline, t.Bio, t.ExperienceYears, t.Specialization,
                t.FacebookUrl, t.YoutubeUrl, t.TiktokUrl, t.WebsiteUrl,
                t.IsVerified, t.FollowerCount, t.CourseCount, t.RatingAverage,
                t.TotalViews, t.TotalStudents, isFollowing);
        }

        // 2. Fallback: slug may be a userId for teachers without a TeacherProfile
        if (!Guid.TryParse(q.Slug, out var userId)) return null;

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId
                     && u.UserRoles.Any(ur => ur.Role.Name == "Teacher"))
            .Select(u => new
            {
                u.Id,
                u.Email,
                ProfileFullName  = u.Profile == null ? null : u.Profile.FullName,
                ProfileAvatarUrl = u.Profile == null ? null : u.Profile.AvatarUrl,
            })
            .FirstOrDefaultAsync(ct);

        if (user == null) return null;

        return new TeacherProfileDto(
            user.Id,
            user.ProfileFullName ?? user.Email,
            user.Id.ToString(),
            user.ProfileAvatarUrl,
            null, null, null, 0, null, null, null, null, null,
            false, 0, 0, 0, 0, 0, false);
    }
}

public class GetTeacherCoursesHandler(IApplicationDbContext db)
    : IRequestHandler<GetTeacherCoursesQuery, List<TeacherCourseItem>>
{
    public async Task<List<TeacherCourseItem>> Handle(GetTeacherCoursesQuery q, CancellationToken ct)
    {
        var profile = await db.TeacherProfiles.AsNoTracking()
            .Where(p => p.Id == q.TeacherProfileId)
            .FirstOrDefaultAsync(ct);
        if (profile == null) return [];

        return await db.Courses.AsNoTracking()
            .Where(c => c.TeacherId == profile.Id
                     && c.Status == MLS.Domain.Entities.CourseStatus.Published)
            .Select(c => new TeacherCourseItem(
                c.Id, c.Title, c.ShortDescription, c.ThumbnailUrl,
                c.Level, c.Price, c.DiscountPrice, c.IsFree, c.Slug,
                c.Enrollments.Count,
                (decimal)Math.Round(
                    (double)(db.CourseReviews
                        .Where(r => r.CourseId == c.Id)
                        .Average(r => (double?)r.Rating) ?? 0.0), 1)))
            .ToListAsync(ct);
    }
}

public class FollowTeacherHandler(IApplicationDbContext db)
    : IRequestHandler<FollowTeacherCommand, bool>
{
    public async Task<bool> Handle(FollowTeacherCommand q, CancellationToken ct)
    {
        var already = await db.TeacherFollowers.AnyAsync(
            f => f.TeacherProfileId == q.TeacherProfileId && f.StudentId == q.StudentId, ct);
        if (already) return false;

        var profile = await db.TeacherProfiles.FindAsync([q.TeacherProfileId], ct);
        if (profile == null) return false;

        db.TeacherFollowers.Add(MLS.Domain.Entities.TeacherFollower.Create(q.TeacherProfileId, q.StudentId));
        profile.IncrementFollower();
        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class UnfollowTeacherHandler(IApplicationDbContext db)
    : IRequestHandler<UnfollowTeacherCommand, bool>
{
    public async Task<bool> Handle(UnfollowTeacherCommand q, CancellationToken ct)
    {
        var follower = await db.TeacherFollowers
            .FirstOrDefaultAsync(f => f.TeacherProfileId == q.TeacherProfileId && f.StudentId == q.StudentId, ct);
        if (follower == null) return false;

        var profile = await db.TeacherProfiles.FindAsync([q.TeacherProfileId], ct);

        db.TeacherFollowers.Remove(follower);
        profile?.DecrementFollower();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
