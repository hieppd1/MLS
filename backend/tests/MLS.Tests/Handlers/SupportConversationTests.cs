using FluentAssertions;
using MLS.Application.Chat.Commands;
using MLS.Application.Chat.Queries;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

public class SupportConversationTests
{
    private sealed class StubChatNotifier : IChatNotificationService
    {
        public List<(string Tenant, Guid ConvId, string Event)> SupportCalls { get; } = new();
        public Task NotifyGroupAsync(string tenantSlug, Guid groupId, string eventName, object data, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task NotifySupportAsync(string tenantSlug, Guid conversationId, string eventName, object data, CancellationToken ct = default)
        { SupportCalls.Add((tenantSlug, conversationId, eventName)); return Task.CompletedTask; }
    }

    private sealed class StubTenant : ITenantContext
    {
        public string TenantSlug => "demo";
        public string SchemaName => "tenant_demo";
        public bool IsResolved => true;
    }

    [Fact]
    public async Task Open_ReusesExistingOpenConversation()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new OpenSupportConversationCommandHandler(db);
        var student = Guid.NewGuid();

        var first = await handler.Handle(new OpenSupportConversationCommand(student), default);
        var second = await handler.Handle(new OpenSupportConversationCommand(student), default);

        first.Should().Be(second);
        db.SupportConversations.Should().ContainSingle();
    }

    [Fact]
    public async Task StudentSend_BroadcastsAndTouchesConversation()
    {
        using var db = InMemoryDbHelper.Create();
        var student = Guid.NewGuid();
        var convId = await new OpenSupportConversationCommandHandler(db)
            .Handle(new OpenSupportConversationCommand(student), default);

        var notifier = new StubChatNotifier();
        var sendHandler = new SendSupportMessageCommandHandler(db, notifier, new StubTenant());

        await sendHandler.Handle(new SendSupportMessageCommand(
            convId, student, SupportSenderRole.Student, ChatMessageType.Text,
            "Hello support", null, null, null, null), default);

        notifier.SupportCalls.Should().ContainSingle(c => c.Event == "SupportMessageReceived" && c.ConvId == convId);
        db.SupportMessages.Should().ContainSingle();
        var conv = db.SupportConversations.Find(convId)!;
        conv.LastMessageAt.Should().NotBeNull();
    }

    [Fact]
    public async Task SupportReply_AutoAssignsConversation()
    {
        using var db = InMemoryDbHelper.Create();
        var student = Guid.NewGuid();
        var convId = await new OpenSupportConversationCommandHandler(db)
            .Handle(new OpenSupportConversationCommand(student), default);

        var agent = Guid.NewGuid();
        await new SendSupportMessageCommandHandler(db, new StubChatNotifier(), new StubTenant())
            .Handle(new SendSupportMessageCommand(
                convId, agent, SupportSenderRole.Support, ChatMessageType.Text,
                "Hi!", null, null, null, null), default);

        var conv = db.SupportConversations.Find(convId)!;
        conv.SupportUserId.Should().Be(agent);
    }

    [Fact]
    public async Task Send_ToClosedConversation_Rejected()
    {
        using var db = InMemoryDbHelper.Create();
        var student = Guid.NewGuid();
        var convId = await new OpenSupportConversationCommandHandler(db)
            .Handle(new OpenSupportConversationCommand(student), default);
        await new CloseSupportConversationCommandHandler(db)
            .Handle(new CloseSupportConversationCommand(convId, student, false), default);

        var act = () => new SendSupportMessageCommandHandler(db, new StubChatNotifier(), new StubTenant())
            .Handle(new SendSupportMessageCommand(
                convId, student, SupportSenderRole.Student, ChatMessageType.Text,
                "hi", null, null, null, null), default);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*đóng*");
    }

    [Fact]
    public async Task GetMessages_ForeignStudent_Forbidden()
    {
        using var db = InMemoryDbHelper.Create();
        var owner = Guid.NewGuid();
        var convId = await new OpenSupportConversationCommandHandler(db)
            .Handle(new OpenSupportConversationCommand(owner), default);

        var act = () => new GetSupportMessagesQueryHandler(db)
            .Handle(new GetSupportMessagesQuery(convId, Guid.NewGuid(), false, 50), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
