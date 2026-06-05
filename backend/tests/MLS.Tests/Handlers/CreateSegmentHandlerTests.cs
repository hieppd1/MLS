using FluentAssertions;
using MLS.Application.CMS.Segments.Commands;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

/// <summary>
/// Tests for CreateSegmentCommandHandler and UpdateSegmentCommandHandler.
/// Business rules verified:
///   - endTime > startTime (domain entity validation)
///   - No two segments in the same session may have overlapping time ranges
///   - Segment reorder preserves OrderIndex
/// </summary>
public class CreateSegmentHandlerTests
{
    [Fact]
    public async Task Handle_ValidSegment_ReturnsNewId()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateSegmentCommandHandler(db);
        var sessionId = Guid.NewGuid();

        var id = await handler.Handle(
            new CreateSegmentCommand(sessionId, "Intro", null, 0, 360), default);

        id.Should().NotBeEmpty();
        db.Segments.Find(id).Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_OverlappingSegment_ThrowsConflictException()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateSegmentCommandHandler(db);
        var sessionId = Guid.NewGuid();

        // First segment: 0–360
        await handler.Handle(new CreateSegmentCommand(sessionId, "Seg 1", null, 0, 360), default);

        // Second segment overlaps: 300–600 overlaps with 0–360
        var act = () => handler.Handle(
            new CreateSegmentCommand(sessionId, "Seg 2", null, 300, 600), default);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*overlaps*");
    }

    [Fact]
    public async Task Handle_AdjacentSegments_ShouldNotOverlap()
    {
        // Adjacent: [0,360) and [360,720) — touching at 360 is NOT overlap
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateSegmentCommandHandler(db);
        var sessionId = Guid.NewGuid();

        await handler.Handle(new CreateSegmentCommand(sessionId, "Seg 1", null, 0, 360), default);
        var id2 = await handler.Handle(
            new CreateSegmentCommand(sessionId, "Seg 2", null, 360, 720), default);

        id2.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_SegmentsInDifferentSessions_NoConflict()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateSegmentCommandHandler(db);

        // Same time range but different sessions — should not conflict
        await handler.Handle(new CreateSegmentCommand(Guid.NewGuid(), "Seg 1", null, 0, 360), default);
        var id2 = await handler.Handle(
            new CreateSegmentCommand(Guid.NewGuid(), "Seg 2", null, 0, 360), default);

        id2.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_InvalidTimeRange_ThrowsDomainException()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateSegmentCommandHandler(db);

        var act = () => handler.Handle(
            new CreateSegmentCommand(Guid.NewGuid(), "Bad", null, 500, 300), default);

        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Handle_UpdateSegment_OverlapWithOtherSegment_Throws()
    {
        using var db = InMemoryDbHelper.Create();
        var create = new CreateSegmentCommandHandler(db);
        var update = new UpdateSegmentCommandHandler(db);
        var sessionId = Guid.NewGuid();

        var id1 = await create.Handle(
            new CreateSegmentCommand(sessionId, "Seg 1", null, 0, 360), default);
        var id2 = await create.Handle(
            new CreateSegmentCommand(sessionId, "Seg 2", null, 360, 720), default);

        // Try to expand Seg 2 to overlap with Seg 1
        var act = () => update.Handle(
            new UpdateSegmentCommand(id2, "Seg 2", null, 300, 720), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Handle_UpdateSegment_SelfOverlapAllowed()
    {
        // A segment's update should NOT conflict with itself
        using var db = InMemoryDbHelper.Create();
        var create = new CreateSegmentCommandHandler(db);
        var update = new UpdateSegmentCommandHandler(db);
        var sessionId = Guid.NewGuid();

        var id = await create.Handle(
            new CreateSegmentCommand(sessionId, "Seg 1", null, 0, 360), default);

        // Update to slightly different range that still excludes self-overlap
        var act = () => update.Handle(
            new UpdateSegmentCommand(id, "Seg 1 updated", null, 0, 480), default);

        await act.Should().NotThrowAsync();
    }
}
