using FluentAssertions;
using MLS.Application.Notifications.Commands;
using MLS.Application.Notifications.Queries;
using MLS.Domain.Entities;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

public class NotificationTests
{
    [Fact]
    public async Task GetNotifications_ReturnsPagedItems()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();

        db.Notifications.AddRange(
            Notification.Create(userId, "ChatMessage", "Title 1", "Body 1"),
            Notification.Create(userId, "ChatMessage", "Title 2", "Body 2"),
            Notification.Create(Guid.NewGuid(), "System", "Other user", "Body"));
        await db.SaveChangesAsync(default);

        var handler = new GetNotificationsQueryHandler(db);
        var result = await handler.Handle(new GetNotificationsQuery(userId, 1, 10), default);

        result.Items.Should().HaveCount(2);
        result.UnreadCount.Should().Be(2);
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task MarkRead_SpecificIds_MarksOnlyThose()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();

        var n1 = Notification.Create(userId, "System", "T1", "B1");
        var n2 = Notification.Create(userId, "System", "T2", "B2");
        db.Notifications.AddRange(n1, n2);
        await db.SaveChangesAsync(default);

        await new MarkNotificationsReadCommandHandler(db)
            .Handle(new MarkNotificationsReadCommand(userId, new[] { n1.Id }, false), default);

        db.Notifications.Find(n1.Id)!.IsRead.Should().BeTrue();
        db.Notifications.Find(n2.Id)!.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task MarkRead_AllTrue_MarksAllForUser()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();

        db.Notifications.AddRange(
            Notification.Create(userId, "System", "T1", "B1"),
            Notification.Create(userId, "System", "T2", "B2"));
        await db.SaveChangesAsync(default);

        await new MarkNotificationsReadCommandHandler(db)
            .Handle(new MarkNotificationsReadCommand(userId, null, true), default);

        db.Notifications.Where(n => n.UserId == userId).All(n => n.IsRead).Should().BeTrue();
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsCorrect()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();

        var n1 = Notification.Create(userId, "System", "T1", "B1");
        var n2 = Notification.Create(userId, "System", "T2", "B2");
        n1.MarkRead();
        db.Notifications.AddRange(n1, n2);
        await db.SaveChangesAsync(default);

        var count = await new GetUnreadCountQueryHandler(db)
            .Handle(new GetUnreadCountQuery(userId), default);

        count.Should().Be(1);
    }
}
