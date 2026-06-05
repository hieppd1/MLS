using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Chat.Queries;

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

public record ChatGroupSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    string? AvatarUrl,
    string Type,
    int CurrentMembers,
    int MaxMembers,
    string? Tags,
    int UnreadCount,
    DateTime? LastMessageAt,
    string? LastMessagePreview,
    string MyStatus,   // "Approved" | "Pending" | "None"
    string? MyRole     // "Owner" | "Moderator" | "Member" | null
);

public record ChatGroupDiscoveryDto(
    Guid Id,
    string Name,
    string? Description,
    string? AvatarUrl,
    string Type,
    int CurrentMembers,
    int MaxMembers,
    string? Tags,
    DateTime CreatedAt
);

public record ChatGroupMemberDto(
    Guid Id,
    Guid UserId,
    string Role,
    string Status,
    DateTime? JoinedAt
);

public record ChatGroupDetailDto(
    Guid Id,
    string Name,
    string? Description,
    string? AvatarUrl,
    string Type,
    int CurrentMembers,
    int MaxMembers,
    string? Tags,
    Guid CreatedBy,
    string MyStatus,
    string? MyRole,
    IReadOnlyList<ChatGroupMemberDto> Members
);

// ─────────────────────────────────────────────────────────────────────────────
// ListMine
// ─────────────────────────────────────────────────────────────────────────────

public record ListMyChatGroupsQuery(Guid UserId) : IRequest<IReadOnlyList<ChatGroupSummaryDto>>;

public class ListMyChatGroupsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<ListMyChatGroupsQuery, IReadOnlyList<ChatGroupSummaryDto>>
{
    public async Task<IReadOnlyList<ChatGroupSummaryDto>> Handle(ListMyChatGroupsQuery req, CancellationToken ct)
    {
        var memberships = await db.ChatGroupMembers
            .Where(m => m.UserId == req.UserId)
            .ToListAsync(ct);

        if (memberships.Count == 0) return Array.Empty<ChatGroupSummaryDto>();

        var groupIds = memberships.Select(m => m.GroupId).ToList();
        var groups = await db.ChatGroups
            .Where(g => groupIds.Contains(g.Id) && g.IsActive)
            .ToListAsync(ct);

        var lastMessages = await db.ChatMessages
            .Where(m => groupIds.Contains(m.GroupId) && !m.IsDeleted)
            .GroupBy(m => m.GroupId)
            .Select(g => new
            {
                GroupId = g.Key,
                LastAt = g.Max(x => x.CreatedAt),
                LastId = g.OrderByDescending(x => x.CreatedAt).Select(x => x.Id).FirstOrDefault(),
                LastContent = g.OrderByDescending(x => x.CreatedAt)
                    .Select(x => x.Type == ChatMessageType.Text ? x.Content : x.Type.ToString())
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        var unreadDict = new Dictionary<Guid, int>();
        foreach (var m in memberships)
        {
            var q = db.ChatMessages.Where(x => x.GroupId == m.GroupId && !x.IsDeleted);
            if (m.LastReadMessageId.HasValue)
            {
                var lastRead = await db.ChatMessages
                    .Where(x => x.Id == m.LastReadMessageId.Value)
                    .Select(x => x.CreatedAt)
                    .FirstOrDefaultAsync(ct);
                q = q.Where(x => x.CreatedAt > lastRead);
            }
            unreadDict[m.GroupId] = await q.CountAsync(ct);
        }

        return groups.Select(g =>
        {
            var mem = memberships.First(x => x.GroupId == g.Id);
            var lm = lastMessages.FirstOrDefault(x => x.GroupId == g.Id);
            return new ChatGroupSummaryDto(
                g.Id, g.Name, g.Description, g.AvatarUrl,
                g.Type.ToString(), g.CurrentMembers, g.MaxMembers, g.Tags,
                unreadDict.GetValueOrDefault(g.Id),
                lm?.LastAt, lm?.LastContent,
                mem.Status.ToString(), mem.Role.ToString());
        })
        .OrderByDescending(g => g.LastMessageAt ?? DateTime.MinValue)
        .ToList();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Discover
// ─────────────────────────────────────────────────────────────────────────────

public record DiscoverChatGroupsQuery(
    Guid? CurrentUserId,
    string? Search,
    ChatGroupType? Type,
    int Page,
    int PageSize
) : IRequest<IReadOnlyList<ChatGroupDiscoveryDto>>;

public class DiscoverChatGroupsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<DiscoverChatGroupsQuery, IReadOnlyList<ChatGroupDiscoveryDto>>
{
    public async Task<IReadOnlyList<ChatGroupDiscoveryDto>> Handle(DiscoverChatGroupsQuery req, CancellationToken ct)
    {
        var page = req.Page <= 0 ? 1 : req.Page;
        var size = req.PageSize is > 0 and <= 50 ? req.PageSize : 12;

        var q = db.ChatGroups.Where(g => g.IsActive);
        if (req.Type.HasValue) q = q.Where(g => g.Type == req.Type.Value);
        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var s = req.Search.Trim().ToLower();
            q = q.Where(g => g.Name.ToLower().Contains(s) ||
                             (g.Tags != null && g.Tags.ToLower().Contains(s)));
        }

        // Optional: exclude groups user is already approved-in
        if (req.CurrentUserId.HasValue)
        {
            var joinedIds = await db.ChatGroupMembers
                .Where(m => m.UserId == req.CurrentUserId.Value &&
                            m.Status == ChatGroupMemberStatus.Approved)
                .Select(m => m.GroupId)
                .ToListAsync(ct);
            q = q.Where(g => !joinedIds.Contains(g.Id));
        }

        var list = await q
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * size).Take(size)
            .Select(g => new ChatGroupDiscoveryDto(
                g.Id, g.Name, g.Description, g.AvatarUrl,
                g.Type.ToString(), g.CurrentMembers, g.MaxMembers, g.Tags, g.CreatedAt))
            .ToListAsync(ct);

        return list;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GetDetail
// ─────────────────────────────────────────────────────────────────────────────

public record GetChatGroupDetailQuery(Guid GroupId, Guid? CurrentUserId) : IRequest<ChatGroupDetailDto?>;

public class GetChatGroupDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetChatGroupDetailQuery, ChatGroupDetailDto?>
{
    public async Task<ChatGroupDetailDto?> Handle(GetChatGroupDetailQuery req, CancellationToken ct)
    {
        var g = await db.ChatGroups.FirstOrDefaultAsync(x => x.Id == req.GroupId && x.IsActive, ct);
        if (g == null) return null;

        var members = await db.ChatGroupMembers
            .Where(m => m.GroupId == req.GroupId)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.JoinedAt)
            .Select(m => new ChatGroupMemberDto(m.Id, m.UserId,
                m.Role.ToString(), m.Status.ToString(), m.JoinedAt))
            .ToListAsync(ct);

        var me = req.CurrentUserId.HasValue
            ? members.FirstOrDefault(m => m.UserId == req.CurrentUserId.Value)
            : null;

        return new ChatGroupDetailDto(
            g.Id, g.Name, g.Description, g.AvatarUrl,
            g.Type.ToString(), g.CurrentMembers, g.MaxMembers, g.Tags, g.CreatedBy,
            me?.Status ?? "None", me?.Role, members);
    }
}
