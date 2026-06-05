using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Teachers;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record AdminTeacherDto(
    Guid UserId,
    Guid? ProfileId,
    string FullName,
    string? AvatarUrl,
    string Email,
    string? Slug,
    string? Headline,
    string? Bio,
    int ExperienceYears,
    string? Specialization,
    string? FacebookUrl,
    string? YoutubeUrl,
    string? TiktokUrl,
    string? WebsiteUrl,
    bool IsVerified,
    bool IsPublic,
    int FollowerCount,
    int CourseCount,
    bool HasProfile);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAdminTeacherListQuery(int Page = 1, int PageSize = 50) : IRequest<List<AdminTeacherDto>>;
public record GetAdminTeacherDetailQuery(Guid UserId) : IRequest<AdminTeacherDto?>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record UpdateTeacherProfileCommand(
    Guid UserId,
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
    bool IsPublic
) : IRequest<Unit>;

public record ToggleTeacherVerifiedCommand(Guid UserId, bool IsVerified) : IRequest<Unit>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetAdminTeacherListHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminTeacherListQuery, List<AdminTeacherDto>>
{
    public async Task<List<AdminTeacherDto>> Handle(GetAdminTeacherListQuery q, CancellationToken ct)
    {
        // Get users with Teacher role
        var teacherRoleId = await db.Roles
            .Where(r => r.Name == "Teacher")
            .Select(r => r.Id)
            .FirstOrDefaultAsync(ct);

        if (teacherRoleId == Guid.Empty) return [];

        var teachers = await db.Users.AsNoTracking()
            .Where(u => db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == teacherRoleId))
            .Include(u => u.Profile)
            .OrderByDescending(u => u.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        var userIds = teachers.Select(t => t.Id).ToList();
        var profiles = await db.TeacherProfiles.AsNoTracking()
            .Where(p => userIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        return teachers.Select(u =>
        {
            profiles.TryGetValue(u.Id, out var profile);
            return new AdminTeacherDto(
                u.Id,
                profile?.Id,
                u.Profile?.FullName ?? u.Email.Split('@')[0],
                profile?.AvatarUrl ?? u.Profile?.AvatarUrl,
                u.Email,
                profile?.Slug,
                profile?.Headline,
                profile?.Bio,
                profile?.ExperienceYears ?? 0,
                profile?.Specialization,
                profile?.FacebookUrl,
                profile?.YoutubeUrl,
                profile?.TiktokUrl,
                profile?.WebsiteUrl,
                profile?.IsVerified ?? false,
                profile?.IsPublic ?? true,
                profile?.FollowerCount ?? 0,
                profile?.CourseCount ?? 0,
                profile != null);
        }).ToList();
    }
}

public class GetAdminTeacherDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminTeacherDetailQuery, AdminTeacherDto?>
{
    public async Task<AdminTeacherDto?> Handle(GetAdminTeacherDetailQuery q, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == q.UserId, ct);
        if (user == null) return null;

        var profile = await db.TeacherProfiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == q.UserId, ct);

        return new AdminTeacherDto(
            user.Id,
            profile?.Id,
            user.Profile?.FullName ?? user.Email.Split('@')[0],
            profile?.AvatarUrl ?? user.Profile?.AvatarUrl,
            user.Email,
            profile?.Slug,
            profile?.Headline,
            profile?.Bio,
            profile?.ExperienceYears ?? 0,
            profile?.Specialization,
            profile?.FacebookUrl,
            profile?.YoutubeUrl,
            profile?.TiktokUrl,
            profile?.WebsiteUrl,
            profile?.IsVerified ?? false,
            profile?.IsPublic ?? true,
            profile?.FollowerCount ?? 0,
            profile?.CourseCount ?? 0,
            profile != null);
    }
}

public class UpdateTeacherProfileHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateTeacherProfileCommand, Unit>
{
    public async Task<Unit> Handle(UpdateTeacherProfileCommand cmd, CancellationToken ct)
    {
        var profile = await db.TeacherProfiles
            .FirstOrDefaultAsync(p => p.UserId == cmd.UserId, ct);

        if (profile == null)
        {
            // Create profile if missing
            profile = TeacherProfile.Create(cmd.UserId, cmd.DisplayName, cmd.Slug,
                cmd.AvatarUrl, cmd.CoverUrl, cmd.Headline, cmd.Bio,
                cmd.ExperienceYears, cmd.Specialization);
            db.TeacherProfiles.Add(profile);
        }
        else
        {
            profile.Update(cmd.DisplayName, cmd.Slug, cmd.AvatarUrl, cmd.CoverUrl,
                cmd.Headline, cmd.Bio, cmd.ExperienceYears, cmd.Specialization,
                cmd.FacebookUrl, cmd.YoutubeUrl, cmd.TiktokUrl, cmd.WebsiteUrl);
            profile.SetPublic(cmd.IsPublic);
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class ToggleTeacherVerifiedHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleTeacherVerifiedCommand, Unit>
{
    public async Task<Unit> Handle(ToggleTeacherVerifiedCommand cmd, CancellationToken ct)
    {
        var profile = await db.TeacherProfiles
            .FirstOrDefaultAsync(p => p.UserId == cmd.UserId, ct)
            ?? throw new MLS.Domain.Common.NotFoundException("TeacherProfile", cmd.UserId);

        profile.SetVerified(cmd.IsVerified);
        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
