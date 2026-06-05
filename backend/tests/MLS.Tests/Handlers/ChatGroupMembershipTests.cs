using FluentAssertions;
using MLS.Application.Chat.Commands;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

public class ChatGroupMembershipTests
{
    private sealed class NullInAppNotifier : IInAppNotificationService
    {
        public Task NotifyAsync(string tenantSlug, Guid userId, string type, string title, string body, string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task NotifyByTemplateAsync(string tenantSlug, Guid userId, string templateKey, string type, Dictionary<string, string> variables, string locale = "vi", string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private sealed class StubTenant : ITenantContext
    {
        public string TenantSlug => "demo";
        public string SchemaName => "tenant_demo";
        public bool IsResolved => true;
    }
    [Fact]
    public async Task Join_PublicGroup_AutoApprovesAndIncrementsMembers()
    {
        using var db = InMemoryDbHelper.Create();
        var creator = Guid.NewGuid();
        var joiner  = Guid.NewGuid();

        db.ChatSettings.Add(ChatSettings.CreateDefault());
        await db.SaveChangesAsync(default);

        var createHandler = new CreateChatGroupCommandHandler(db);
        var groupId = await createHandler.Handle(
            new CreateChatGroupCommand(creator, "Public Group", ChatGroupType.Public,
                null, null, 10, null), default);

        var joinHandler = new JoinChatGroupCommandHandler(db, new NullInAppNotifier(), new StubTenant());
        var status = await joinHandler.Handle(
            new JoinChatGroupCommand(groupId, joiner), default);

        status.Should().Be(ChatGroupMemberStatus.Approved);
        var group = db.ChatGroups.Find(groupId);
        group!.CurrentMembers.Should().Be(2);
    }

    [Fact]
    public async Task Join_PrivateGroup_GoesPending_NotCounted()
    {
        using var db = InMemoryDbHelper.Create();
        var creator = Guid.NewGuid();
        var joiner  = Guid.NewGuid();

        db.ChatSettings.Add(ChatSettings.CreateDefault());
        await db.SaveChangesAsync(default);

        var groupId = await new CreateChatGroupCommandHandler(db).Handle(
            new CreateChatGroupCommand(creator, "Private", ChatGroupType.Private,
                null, null, 10, null), default);

        var status = await new JoinChatGroupCommandHandler(db, new NullInAppNotifier(), new StubTenant()).Handle(
            new JoinChatGroupCommand(groupId, joiner), default);

        status.Should().Be(ChatGroupMemberStatus.Pending);
        db.ChatGroups.Find(groupId)!.CurrentMembers.Should().Be(1); // only owner
    }

    [Fact]
    public async Task ApprovePending_IncrementsMembersAndSetsApproved()
    {
        using var db = InMemoryDbHelper.Create();
        var creator = Guid.NewGuid();
        var joiner  = Guid.NewGuid();
        db.ChatSettings.Add(ChatSettings.CreateDefault());
        await db.SaveChangesAsync(default);

        var groupId = await new CreateChatGroupCommandHandler(db).Handle(
            new CreateChatGroupCommand(creator, "Private", ChatGroupType.Private,
                null, null, 10, null), default);

        await new JoinChatGroupCommandHandler(db, new NullInAppNotifier(), new StubTenant()).Handle(
            new JoinChatGroupCommand(groupId, joiner), default);

        await new ApproveMemberCommandHandler(db, new NullInAppNotifier(), new StubTenant()).Handle(
            new ApproveMemberCommand(groupId, creator, joiner), default);

        var mem = db.ChatGroupMembers.Single(m => m.GroupId == groupId && m.UserId == joiner);
        mem.Status.Should().Be(ChatGroupMemberStatus.Approved);
        db.ChatGroups.Find(groupId)!.CurrentMembers.Should().Be(2);
    }

    [Fact]
    public async Task Join_WhenGroupFull_Throws()
    {
        using var db = InMemoryDbHelper.Create();
        var creator = Guid.NewGuid();
        db.ChatSettings.Add(ChatSettings.CreateDefault());
        await db.SaveChangesAsync(default);

        // MaxMembers = 1 → only creator fits
        var groupId = await new CreateChatGroupCommandHandler(db).Handle(
            new CreateChatGroupCommand(creator, "Tiny", ChatGroupType.Public,
                null, null, 1, null), default);

        var act = () => new JoinChatGroupCommandHandler(db, new NullInAppNotifier(), new StubTenant()).Handle(
            new JoinChatGroupCommand(groupId, Guid.NewGuid()), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*đầy*");
    }

    [Fact]
    public async Task Create_RespectsMaxGroupsPerUserLimit()
    {
        using var db = InMemoryDbHelper.Create();
        var settings = ChatSettings.CreateDefault();
        // Force limit = 1
        settings.Update(1, 12, true, true, 5120, 20480, null);
        db.ChatSettings.Add(settings);
        await db.SaveChangesAsync(default);

        var owner = Guid.NewGuid();
        var handler = new CreateChatGroupCommandHandler(db);

        await handler.Handle(new CreateChatGroupCommand(
            owner, "G1", ChatGroupType.Public, null, null, null, null), default);

        var act = () => handler.Handle(new CreateChatGroupCommand(
            owner, "G2", ChatGroupType.Public, null, null, null, null), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*giới hạn*");
    }
}
