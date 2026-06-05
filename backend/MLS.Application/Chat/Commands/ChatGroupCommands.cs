using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Chat.Commands;

// ─────────────────────────────────────────────────────────────────────────────
// Create / Update / Delete
// ─────────────────────────────────────────────────────────────────────────────

public record CreateChatGroupCommand(
    Guid CreatorId,
    string Name,
    ChatGroupType Type,
    string? Description,
    string? AvatarUrl,
    int? MaxMembers,
    string? Tags
) : IRequest<Guid>;

public class CreateChatGroupCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateChatGroupCommand, Guid>
{
    public async Task<Guid> Handle(CreateChatGroupCommand req, CancellationToken ct)
    {
        var settings = await db.ChatSettings.FirstOrDefaultAsync(ct);
        var maxGroupsPerUser = settings?.MaxGroupsPerUser ?? 3;
        var defaultMaxMembers = settings?.MaxMembersPerGroup ?? 12;

        var ownedCount = await db.ChatGroups
            .CountAsync(g => g.CreatedBy == req.CreatorId && g.IsActive, ct);
        if (ownedCount >= maxGroupsPerUser)
            throw new InvalidOperationException(
                $"Đã đạt giới hạn {maxGroupsPerUser} nhóm/người.");

        var maxMembers = req.MaxMembers is > 0 ? req.MaxMembers.Value : defaultMaxMembers;

        var group = ChatGroup.Create(
            req.Name, req.CreatorId, req.Type, req.Description, req.AvatarUrl, maxMembers, req.Tags);

        var owner = ChatGroupMember.Create(group.Id, req.CreatorId,
            ChatGroupMemberRole.Owner, ChatGroupMemberStatus.Approved);

        group.IncrementMembers();

        db.ChatGroups.Add(group);
        db.ChatGroupMembers.Add(owner);
        await db.SaveChangesAsync(ct);
        return group.Id;
    }
}

public record UpdateChatGroupCommand(
    Guid GroupId,
    Guid ActorId,
    string Name,
    ChatGroupType Type,
    string? Description,
    string? AvatarUrl,
    int MaxMembers,
    string? Tags
) : IRequest;

public class UpdateChatGroupCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateChatGroupCommand>
{
    public async Task Handle(UpdateChatGroupCommand req, CancellationToken ct)
    {
        var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct)
            ?? throw new KeyNotFoundException("Nhóm không tồn tại.");
        await EnsureManagerAsync(db, req.GroupId, req.ActorId, ct);
        group.Update(req.Name, req.Description, req.AvatarUrl, req.Type, req.MaxMembers, req.Tags);
        await db.SaveChangesAsync(ct);
    }

    internal static async Task EnsureManagerAsync(IApplicationDbContext db, Guid groupId, Guid actorId, CancellationToken ct)
    {
        var member = await db.ChatGroupMembers
            .FirstOrDefaultAsync(m =>
                m.GroupId == groupId &&
                m.UserId == actorId &&
                m.Status == ChatGroupMemberStatus.Approved, ct)
            ?? throw new UnauthorizedAccessException("Bạn không phải thành viên nhóm.");
        if (member.Role is not (ChatGroupMemberRole.Owner or ChatGroupMemberRole.Moderator))
            throw new UnauthorizedAccessException("Chỉ Owner/Moderator có quyền này.");
    }
}

public record DeleteChatGroupCommand(Guid GroupId, Guid ActorId, bool IsAdmin = false) : IRequest;

public class DeleteChatGroupCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteChatGroupCommand>
{
    public async Task Handle(DeleteChatGroupCommand req, CancellationToken ct)
    {
        var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct)
            ?? throw new KeyNotFoundException("Nhóm không tồn tại.");
        if (!req.IsAdmin)
        {
            var owner = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
                m.GroupId == req.GroupId && m.UserId == req.ActorId &&
                m.Role == ChatGroupMemberRole.Owner, ct)
                ?? throw new UnauthorizedAccessException("Chỉ Owner hoặc Admin mới được xoá nhóm.");
        }
        group.Deactivate();
        await db.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Membership: Join / Leave / Approve / Reject / Remove / Promote
// ─────────────────────────────────────────────────────────────────────────────

public record JoinChatGroupCommand(Guid GroupId, Guid UserId) : IRequest<ChatGroupMemberStatus>;

public class JoinChatGroupCommandHandler(IApplicationDbContext db, IInAppNotificationService inAppNotifier, ITenantContext tenant)
    : IRequestHandler<JoinChatGroupCommand, ChatGroupMemberStatus>
{
    public async Task<ChatGroupMemberStatus> Handle(JoinChatGroupCommand req, CancellationToken ct)
    {
        var group = await db.ChatGroups.FirstOrDefaultAsync(
            g => g.Id == req.GroupId && g.IsActive, ct)
            ?? throw new KeyNotFoundException("Nhóm không tồn tại.");

        var existing = await db.ChatGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == req.GroupId && m.UserId == req.UserId, ct);
        if (existing != null)
        {
            if (existing.Status == ChatGroupMemberStatus.Rejected)
                throw new InvalidOperationException("Yêu cầu trước đã bị từ chối.");
            return existing.Status;
        }

        if (group.CurrentMembers >= group.MaxMembers)
            throw new InvalidOperationException("Nhóm đã đầy.");

        var status = group.Type == ChatGroupType.Public
            ? ChatGroupMemberStatus.Approved
            : ChatGroupMemberStatus.Pending;

        var member = ChatGroupMember.Create(group.Id, req.UserId, ChatGroupMemberRole.Member, status);
        db.ChatGroupMembers.Add(member);

        if (status == ChatGroupMemberStatus.Approved)
            group.IncrementMembers();

        await db.SaveChangesAsync(ct);

        // For private groups, notify Owner + Moderators about the join request
        if (status == ChatGroupMemberStatus.Pending)
        {
            var requester = await db.Users.FirstOrDefaultAsync(u => u.Id == req.UserId, ct);
            var requesterName = requester?.Email ?? req.UserId.ToString();

            var ownerIds = await db.ChatGroupMembers
                .Where(m => m.GroupId == req.GroupId &&
                            m.Status == ChatGroupMemberStatus.Approved &&
                            (m.Role == ChatGroupMemberRole.Owner || m.Role == ChatGroupMemberRole.Moderator))
                .Select(m => m.UserId)
                .ToListAsync(ct);

            foreach (var ownerId in ownerIds)
            {
                _ = inAppNotifier.NotifyAsync(
                    tenant.TenantSlug, ownerId, "GroupJoinRequest",
                    "Yêu cầu tham gia nhóm mới",
                    $"{requesterName} muốn tham gia nhóm \"{group.Name}\".",
                    $"/teacher/chat/groups", ct);
            }
        }

        return status;
    }
}

public record LeaveChatGroupCommand(Guid GroupId, Guid UserId) : IRequest;

public class LeaveChatGroupCommandHandler(IApplicationDbContext db)
    : IRequestHandler<LeaveChatGroupCommand>
{
    public async Task Handle(LeaveChatGroupCommand req, CancellationToken ct)
    {
        var member = await db.ChatGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == req.GroupId && m.UserId == req.UserId, ct)
            ?? throw new KeyNotFoundException("Bạn không thuộc nhóm này.");
        if (member.Role == ChatGroupMemberRole.Owner)
            throw new InvalidOperationException("Owner không thể rời nhóm — chuyển quyền hoặc xoá nhóm.");

        var wasApproved = member.Status == ChatGroupMemberStatus.Approved;
        db.ChatGroupMembers.Remove(member);
        if (wasApproved)
        {
            var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct);
            group?.DecrementMembers();
        }
        await db.SaveChangesAsync(ct);
    }
}

public record ApproveMemberCommand(Guid GroupId, Guid ActorId, Guid MemberId) : IRequest;

public class ApproveMemberCommandHandler(IApplicationDbContext db, IInAppNotificationService inAppNotifier, ITenantContext tenant)
    : IRequestHandler<ApproveMemberCommand>
{
    public async Task Handle(ApproveMemberCommand req, CancellationToken ct)
    {
        await UpdateChatGroupCommandHandler.EnsureManagerAsync(db, req.GroupId, req.ActorId, ct);
        var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct)
            ?? throw new KeyNotFoundException("Nhóm không tồn tại.");
        var member = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.MemberId, ct)
            ?? throw new KeyNotFoundException("Thành viên không tồn tại.");
        if (member.Status != ChatGroupMemberStatus.Pending)
            throw new InvalidOperationException("Yêu cầu không ở trạng thái chờ duyệt.");
        if (group.CurrentMembers >= group.MaxMembers)
            throw new InvalidOperationException("Nhóm đã đầy.");
        member.Approve(req.ActorId);
        group.IncrementMembers();
        await db.SaveChangesAsync(ct);

        // Notify approved user
        _ = inAppNotifier.NotifyAsync(
            tenant.TenantSlug, req.MemberId, "GroupApproved",
            $"Yêu cầu tham gia nhóm đã được duyệt",
            $"Bạn đã được thêm vào nhóm \"{group.Name}\".",
            $"/nhom?room={req.GroupId}", ct);
    }
}

public record RejectMemberCommand(Guid GroupId, Guid ActorId, Guid MemberId) : IRequest;

public class RejectMemberCommandHandler(IApplicationDbContext db)
    : IRequestHandler<RejectMemberCommand>
{
    public async Task Handle(RejectMemberCommand req, CancellationToken ct)
    {
        await UpdateChatGroupCommandHandler.EnsureManagerAsync(db, req.GroupId, req.ActorId, ct);
        var member = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.MemberId, ct)
            ?? throw new KeyNotFoundException("Thành viên không tồn tại.");
        member.Reject(req.ActorId);
        await db.SaveChangesAsync(ct);
    }
}

public record RemoveMemberCommand(Guid GroupId, Guid ActorId, Guid MemberId) : IRequest;

public class RemoveMemberCommandHandler(IApplicationDbContext db)
    : IRequestHandler<RemoveMemberCommand>
{
    public async Task Handle(RemoveMemberCommand req, CancellationToken ct)
    {
        await UpdateChatGroupCommandHandler.EnsureManagerAsync(db, req.GroupId, req.ActorId, ct);
        var member = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.MemberId, ct)
            ?? throw new KeyNotFoundException("Thành viên không tồn tại.");
        if (member.Role == ChatGroupMemberRole.Owner)
            throw new InvalidOperationException("Không thể xoá Owner.");
        var wasApproved = member.Status == ChatGroupMemberStatus.Approved;
        db.ChatGroupMembers.Remove(member);
        if (wasApproved)
        {
            var group = await db.ChatGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId, ct);
            group?.DecrementMembers();
        }
        await db.SaveChangesAsync(ct);
    }
}

public record PromoteMemberCommand(Guid GroupId, Guid ActorId, Guid MemberId, ChatGroupMemberRole NewRole) : IRequest;

public class PromoteMemberCommandHandler(IApplicationDbContext db)
    : IRequestHandler<PromoteMemberCommand>
{
    public async Task Handle(PromoteMemberCommand req, CancellationToken ct)
    {
        var actor = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.ActorId &&
            m.Status == ChatGroupMemberStatus.Approved, ct)
            ?? throw new UnauthorizedAccessException("Bạn không thuộc nhóm.");
        if (actor.Role != ChatGroupMemberRole.Owner)
            throw new UnauthorizedAccessException("Chỉ Owner mới được phân quyền.");
        if (req.NewRole == ChatGroupMemberRole.Owner)
            throw new InvalidOperationException("Chuyển quyền Owner chưa hỗ trợ.");
        var member = await db.ChatGroupMembers.FirstOrDefaultAsync(m =>
            m.GroupId == req.GroupId && m.UserId == req.MemberId, ct)
            ?? throw new KeyNotFoundException("Thành viên không tồn tại.");
        member.Promote(req.NewRole);
        await db.SaveChangesAsync(ct);
    }
}
