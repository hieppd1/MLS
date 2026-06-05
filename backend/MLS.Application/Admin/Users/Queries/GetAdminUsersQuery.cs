using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;

namespace MLS.Application.Admin.Users.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────
public record AdminUserListItemDto(
    Guid Id,
    string Email,
    string? Phone,
    string FullName,
    string? AvatarUrl,
    string Role,
    string Status,
    DateTime CreatedAt
);

public record AdminUserDetailDto(
    Guid Id,
    string Email,
    string? Phone,
    string FullName,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Address,
    string? CurrentLevel,
    string Role,
    string Status,
    DateTime CreatedAt,
    List<SessionSummaryDto> ActiveSessions
);

public record SessionSummaryDto(Guid Id, string? DeviceId, DateTime CreatedAt, DateTime ExpiresAt);

// ── List Query ────────────────────────────────────────────────────────────────
public record GetAdminUsersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Role = null,
    string? Status = null
) : IRequest<PagedResult<AdminUserListItemDto>>;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

public class GetAdminUsersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminUsersQuery, PagedResult<AdminUserListItemDto>>
{
    public async Task<PagedResult<AdminUserListItemDto>> Handle(
        GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLowerInvariant();
            query = query.Where(u =>
                u.Email.Contains(s) ||
                (u.Profile != null && u.Profile.FullName.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == request.Role));

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<MLS.Domain.Entities.UserStatus>(request.Status, true, out var statusEnum))
            query = query.Where(u => u.Status == statusEnum);

        var total = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = users.Select(u => new AdminUserListItemDto(
            u.Id, u.Email, u.Phone,
            u.Profile?.FullName ?? string.Empty,
            u.Profile?.AvatarUrl,
            u.UserRoles.FirstOrDefault()?.Role.Name ?? "Student",
            u.Status.ToString(),
            u.CreatedAt
        )).ToList();

        return new PagedResult<AdminUserListItemDto>(items, total, request.Page, request.PageSize);
    }
}

// ── Detail Query ──────────────────────────────────────────────────────────────
public record GetAdminUserDetailQuery(Guid UserId) : IRequest<AdminUserDetailDto>;

public class GetAdminUserDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminUserDetailQuery, AdminUserDetailDto>
{
    public async Task<AdminUserDetailDto> Handle(GetAdminUserDetailQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        var sessions = user.RefreshTokens
            .Where(rt => rt.IsActive)
            .OrderByDescending(rt => rt.CreatedAt)
            .Select(rt => new SessionSummaryDto(rt.Id, rt.DeviceId, rt.CreatedAt, rt.ExpiresAt))
            .ToList();

        return new AdminUserDetailDto(
            user.Id, user.Email, user.Phone,
            user.Profile?.FullName ?? string.Empty,
            user.Profile?.AvatarUrl,
            user.Profile?.DateOfBirth,
            user.Profile?.Gender,
            user.Profile?.Address,
            user.Profile?.CurrentLevel,
            user.UserRoles.FirstOrDefault()?.Role.Name ?? "Student",
            user.Status.ToString(),
            user.CreatedAt,
            sessions
        );
    }
}
