using FluentAssertions;
using MLS.Domain.Entities;

namespace MLS.Tests.Domain;

/// <summary>
/// Unit tests for SessionProgress domain entity.
/// Business spec (section 6.2, 7.1):
///   - Progress tracks watch percentage and last position for resume
///   - Status transitions: NotStarted → InProgress → Completed
/// </summary>
public class SessionProgressTests
{
    [Fact]
    public void Create_InitialState_IsInProgress()
    {
        // Create() starts as InProgress so the session is tracked from first call
        var progress = SessionProgress.Create(Guid.NewGuid(), Guid.NewGuid());

        progress.Status.Should().Be(SessionProgressStatus.InProgress);
        progress.WatchPercentage.Should().Be(0);
        progress.LastPositionSeconds.Should().Be(0);
        progress.WatchedSeconds.Should().Be(0);
        progress.CompletedAt.Should().BeNull();
    }

    [Fact]
    public void UpdatePosition_SetsPositionAndMovesToInProgress()
    {
        var progress = SessionProgress.Create(Guid.NewGuid(), Guid.NewGuid());

        progress.UpdatePosition(lastPositionSeconds: 120, watchedSeconds: 100, watchPercentage: 22.2);

        progress.Status.Should().Be(SessionProgressStatus.InProgress);
        progress.LastPositionSeconds.Should().Be(120);
        progress.WatchedSeconds.Should().Be(100);
        progress.WatchPercentage.Should().BeApproximately(22.2, 0.01);
    }

    [Fact]
    public void Complete_SetsStatusAndCompletedAt()
    {
        var progress = SessionProgress.Create(Guid.NewGuid(), Guid.NewGuid());
        progress.UpdatePosition(0, 4000, 80.0);

        progress.Complete();

        progress.Status.Should().Be(SessionProgressStatus.Completed);
        progress.CompletedAt.Should().NotBeNull();
        progress.CompletedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Complete_CanCallMultipleTimes_StatusRemainsCompleted()
    {
        var progress = SessionProgress.Create(Guid.NewGuid(), Guid.NewGuid());
        progress.UpdatePosition(0, 4000, 80.0);
        progress.Complete();

        // Second call — should not throw
        progress.Complete();

        progress.Status.Should().Be(SessionProgressStatus.Completed);
    }
}
