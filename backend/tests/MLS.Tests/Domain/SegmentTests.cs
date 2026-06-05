using FluentAssertions;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Tests.Domain;

/// <summary>
/// Unit tests for Segment domain entity business rules.
/// Business spec (section 2.3):
///   - Segment must have startTime >= 0
///   - endTime must be > startTime
///   - Segment duration guideline: 6–8 min (360–480 s); enforced at handler level for overlaps
/// </summary>
public class SegmentTests
{
    [Fact]
    public void Create_ValidSegment_ShouldSucceed()
    {
        // 5:00 – 8:00 (3 min) — valid
        var segment = Segment.Create(Guid.NewGuid(), "Grammar 1", null, 300, 480, 0);

        segment.Should().NotBeNull();
        segment.StartTime.Should().Be(300);
        segment.EndTime.Should().Be(480);
        segment.Title.Should().Be("Grammar 1");
    }

    [Fact]
    public void Create_EndTimeLessThanStartTime_ThrowsDomainException()
    {
        var act = () => Segment.Create(Guid.NewGuid(), "Bad", null, startTime: 500, endTime: 300, 0);

        act.Should().Throw<DomainException>()
            .WithMessage("*endTime must be greater than startTime*");
    }

    [Fact]
    public void Create_EndTimeEqualStartTime_ThrowsDomainException()
    {
        var act = () => Segment.Create(Guid.NewGuid(), "Bad", null, startTime: 300, endTime: 300, 0);

        act.Should().Throw<DomainException>()
            .WithMessage("*endTime must be greater than startTime*");
    }

    [Fact]
    public void Create_NegativeStartTime_ThrowsDomainException()
    {
        var act = () => Segment.Create(Guid.NewGuid(), "Bad", null, startTime: -10, endTime: 300, 0);

        act.Should().Throw<DomainException>()
            .WithMessage("*startTime must be >= 0*");
    }

    [Fact]
    public void Create_TitleIsWhitespaceTrimmed()
    {
        var segment = Segment.Create(Guid.NewGuid(), "  Grammar 1  ", null, 0, 120, 0);

        segment.Title.Should().Be("Grammar 1");
    }

    [Fact]
    public void Update_ValidTimestamps_ShouldSucceed()
    {
        var segment = Segment.Create(Guid.NewGuid(), "Old", null, 0, 300, 0);

        segment.Update("New", null, 300, 600);

        segment.StartTime.Should().Be(300);
        segment.EndTime.Should().Be(600);
        segment.Title.Should().Be("New");
    }

    [Fact]
    public void Update_InvalidTimestamps_ThrowsDomainException()
    {
        var segment = Segment.Create(Guid.NewGuid(), "Old", null, 0, 300, 0);

        var act = () => segment.Update("New", null, 300, 200);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Create_NinetyMinuteSession_SegmentsCanCoverFullDuration()
    {
        // Business spec: session max ~90 min (5400s); segments cover the full video
        var sessionId = Guid.NewGuid();
        var s1 = Segment.Create(sessionId, "Intro", null, 0, 360, 0);
        var s2 = Segment.Create(sessionId, "Grammar", null, 360, 840, 1);
        var s3 = Segment.Create(sessionId, "Vocab", null, 840, 1260, 2);

        s1.StartTime.Should().Be(0);
        s3.EndTime.Should().Be(1260);
    }
}
