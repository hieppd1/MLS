using FluentAssertions;
using MLS.Application.Chat.Commands;
using MLS.Application.Chat.Queries;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

public class ChatMessagingTests
{
    private sealed class StubChatNotifier : IChatNotificationService
    {
        public List<(string Tenant, Guid GroupId, string Event, object Data)> GroupCalls { get; } = new();
        public Task NotifyGroupAsync(string tenantSlug, Guid groupId, string eventName, object data, CancellationToken ct = default)
        { GroupCalls.Add((tenantSlug, groupId, eventName, data)); return Task.CompletedTask; }
        public Task NotifySupportAsync(string tenantSlug, Guid conversationId, string eventName, object data, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private sealed class StubTenant : ITenantContext
    {
        public string TenantSlug => "demo";
        public string SchemaName => "tenant_demo";
        public bool IsResolved => true;
    }

    private sealed class NullInAppNotifier : MLS.Application.Common.Interfaces.IInAppNotificationService
    {
        public Task NotifyAsync(string tenantSlug, Guid userId, string type, string title, string body, string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task NotifyByTemplateAsync(string tenantSlug, Guid userId, string templateKey, string type, Dictionary<string, string> variables, string locale = "vi", string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private static async Task<(Guid groupId, Guid owner, Guid memberId)> SeedPublicGroupAsync(
        MLS.Infrastructure.Persistence.ApplicationDbContext db)
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        db.ChatSettings.Add(ChatSettings.CreateDefault());
        await db.SaveChangesAsync(default);
        var groupId = await new CreateChatGroupCommandHandler(db).Handle(
            new CreateChatGroupCommand(owner, "G", ChatGroupType.Public, null, null, 10, null), default);
        await new JoinChatGroupCommandHandler(db, new NullInAppNotifier(), new StubTenant()).Handle(
            new JoinChatGroupCommand(groupId, other), default);
        return (groupId, owner, other);
    }

    [Fact]
    public async Task Send_Text_BroadcastsAndPersists()
    {
        using var db = InMemoryDbHelper.Create();
        var (groupId, owner, _) = await SeedPublicGroupAsync(db);
        var notifier = new StubChatNotifier();
        var handler = new SendChatMessageCommandHandler(db, notifier, new NullInAppNotifier(), new StubTenant());

        var id = await handler.Handle(new SendChatMessageCommand(
            groupId, owner, ChatMessageType.Text, "Hello", null, null), default);

        id.Should().NotBeEmpty();
        notifier.GroupCalls.Should().ContainSingle(c => c.Event == "MessageReceived" && c.GroupId == groupId);
        db.ChatMessages.Should().ContainSingle(m => m.Id == id && m.Content == "Hello");
    }

    [Fact]
    public async Task Send_AsNonMember_ThrowsUnauthorized()
    {
        using var db = InMemoryDbHelper.Create();
        var (groupId, _, _) = await SeedPublicGroupAsync(db);
        var handler = new SendChatMessageCommandHandler(db, new StubChatNotifier(), new NullInAppNotifier(), new StubTenant());

        var act = () => handler.Handle(new SendChatMessageCommand(
            groupId, Guid.NewGuid(), ChatMessageType.Text, "hi", null, null), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetMessages_ReturnsAscendingWithCursor()
    {
        using var db = InMemoryDbHelper.Create();
        var (groupId, owner, _) = await SeedPublicGroupAsync(db);
        var sender = new SendChatMessageCommandHandler(db, new StubChatNotifier(), new NullInAppNotifier(), new StubTenant());

        for (int i = 0; i < 5; i++)
        {
            await sender.Handle(new SendChatMessageCommand(
                groupId, owner, ChatMessageType.Text, $"m{i}", null, null), default);
            await Task.Delay(2);
        }

        var page = await new GetChatMessagesQueryHandler(db).Handle(
            new GetChatMessagesQuery(groupId, owner, null, 3), default);

        page.Items.Should().HaveCount(3);
        // Ascending order — latest 3 messages with oldest first within the page
        page.Items.Select(i => i.Content).Should().BeEquivalentTo(new[] { "m2", "m3", "m4" }, o => o.WithStrictOrdering());
        page.NextCursor.Should().NotBeNull();
    }

    [Fact]
    public async Task Delete_OwnMessage_AllowedAndSoftDeleted()
    {
        using var db = InMemoryDbHelper.Create();
        var (groupId, owner, _) = await SeedPublicGroupAsync(db);
        var notifier = new StubChatNotifier();
        var id = await new SendChatMessageCommandHandler(db, notifier, new NullInAppNotifier(), new StubTenant())
            .Handle(new SendChatMessageCommand(groupId, owner, ChatMessageType.Text, "x", null, null), default);

        await new DeleteChatMessageCommandHandler(db, notifier, new StubTenant())
            .Handle(new DeleteChatMessageCommand(groupId, id, owner), default);

        var msg = db.ChatMessages.Find(id);
        msg!.IsDeleted.Should().BeTrue();
        msg.Content.Should().BeNull();
        notifier.GroupCalls.Should().Contain(c => c.Event == "MessageDeleted");
    }

    [Fact]
    public async Task Delete_OthersMessage_AsMember_Forbidden()
    {
        using var db = InMemoryDbHelper.Create();
        var (groupId, owner, member) = await SeedPublicGroupAsync(db);
        var id = await new SendChatMessageCommandHandler(db, new StubChatNotifier(), new NullInAppNotifier(), new StubTenant())
            .Handle(new SendChatMessageCommand(groupId, owner, ChatMessageType.Text, "x", null, null), default);

        var act = () => new DeleteChatMessageCommandHandler(db, new StubChatNotifier(), new StubTenant())
            .Handle(new DeleteChatMessageCommand(groupId, id, member), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
