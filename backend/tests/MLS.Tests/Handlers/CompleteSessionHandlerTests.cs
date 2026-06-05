using FluentAssertions;
using MLS.Application.Learning.Commands;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

/// <summary>
/// Tests for CompleteSessionCommandHandler.
/// Business rules verified (spec 6.2):
///   - Session can only be completed when WatchPercentage >= 80%
///   - CompleteSession requires an existing progress record (student must have started)
///   - After completion, status is Completed
/// </summary>
public class CompleteSessionHandlerTests
{
    [Fact]
    public async Task Handle_WatchPercentage80_CompletesSession()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();

        // Setup: create progress at exactly 80%
        var progress = SessionProgress.Create(userId, sessionId);
        progress.UpdatePosition(0, 4320, 80.0);
        db.SessionProgresses.Add(progress);
        await db.SaveChangesAsync(default);

        var handler = new CompleteSessionCommandHandler(db);
        await handler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        var updated = await db.SessionProgresses.FindAsync([progress.Id]);
        updated!.Status.Should().Be(SessionProgressStatus.Completed);
        updated.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_WatchPercentageAbove80_CompletesSession()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();

        var progress = SessionProgress.Create(userId, sessionId);
        progress.UpdatePosition(0, 5000, 95.5);
        db.SessionProgresses.Add(progress);
        await db.SaveChangesAsync(default);

        var handler = new CompleteSessionCommandHandler(db);
        await handler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        (await db.SessionProgresses.FindAsync([progress.Id]))!
            .Status.Should().Be(SessionProgressStatus.Completed);
    }

    [Fact]
    public async Task Handle_WatchPercentageBelow80_ThrowsDomainException()
    {
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();

        // Only 50% watched
        var progress = SessionProgress.Create(userId, sessionId);
        progress.UpdatePosition(0, 2700, 50.0);
        db.SessionProgresses.Add(progress);
        await db.SaveChangesAsync(default);

        var handler = new CompleteSessionCommandHandler(db);
        var act = () => handler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Cannot complete session*Minimum required: 80%*");
    }

    [Fact]
    public async Task Handle_WatchPercentage79_ThrowsDomainException()
    {
        // Boundary test: 79.9% is NOT enough
        using var db = InMemoryDbHelper.Create();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();

        var progress = SessionProgress.Create(userId, sessionId);
        progress.UpdatePosition(0, 4300, 79.9);
        db.SessionProgresses.Add(progress);
        await db.SaveChangesAsync(default);

        var handler = new CompleteSessionCommandHandler(db);
        var act = () => handler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Handle_NoProgressRecord_ThrowsNotFoundException()
    {
        // Must call StartSession before CompleteSession
        using var db = InMemoryDbHelper.Create();
        var handler = new CompleteSessionCommandHandler(db);

        var act = () => handler.Handle(
            new CompleteSessionCommand(Guid.NewGuid(), Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public void MinWatchPercentage_Is80()
    {
        // Guard against accidental constant change
        CompleteSessionCommandHandler.MinWatchPercentage.Should().Be(80.0);
    }
}
