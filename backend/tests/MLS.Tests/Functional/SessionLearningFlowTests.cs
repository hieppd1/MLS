using FluentAssertions;
using MLS.Application.CMS.Segments.Commands;
using MLS.Application.CMS.LearningAssets.Commands;
using MLS.Application.Learning.Commands;
using MLS.Application.Learning.Queries;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Infrastructure.Persistence;
using MLS.Tests.Helpers;

namespace MLS.Tests.Functional;

/// <summary>
/// Functional tests covering the end-to-end Interactive Learning flow.
/// 
/// Business flow (spec section 6.1):
///   Student opens session
///     → Video starts playing
///     → Timeline shows segments
///     → Student clicks Grammar → video seeks to timestamp
///     → Student completes quiz → interaction recorded
///     → Tracking progress saved
///   
/// These tests verify the flow works end-to-end without the HTTP layer,
/// testing all handler interactions together.
/// </summary>
public class SessionLearningFlowTests
{
    // ── Arrange helpers ───────────────────────────────────────────────────────

    private static async Task<(Guid sessionId, Guid segmentId, Guid assetId, ApplicationDbContext db)>
        SetupLearningContentAsync()
    {
        var db = InMemoryDbHelper.Create();

        // Create session (domain object — mimics what CMS teacher does)
        var sessionId = Guid.NewGuid();
        var session = Session.Create(Guid.NewGuid(), "Buổi học 1: Present Simple", null, 0);
        // Use reflection-based test or expose method for testing:
        // We access the session through the DB to simulate the full flow
        db.Sessions.Add(session);
        await db.SaveChangesAsync(default);

        // Create segment via handler (includes overlap validation)
        var segHandler = new CreateSegmentCommandHandler(db);
        var segmentId = await segHandler.Handle(
            new CreateSegmentCommand(session.Id, "Grammar: Present Simple", null, 0, 480), default);

        // Create grammar asset via handler (includes bounds validation)
        var assetHandler = new CreateLearningAssetCommandHandler(db);
        var assetId = await assetHandler.Handle(
            new CreateLearningAssetCommand(segmentId, "GrammarBlock", "Present Simple Rules",
                "S + V(s/es)", StartTime: 60, EndTime: 180), default);

        return (session.Id, segmentId, assetId, db);
    }

    // ── Full Learning Flow ─────────────────────────────────────────────────

    [Fact]
    public async Task FullLearningFlow_StartWatchComplete_TracksCorrectly()
    {
        var (sessionId, segmentId, assetId, db) = await SetupLearningContentAsync();
        var userId = Guid.NewGuid();

        // Step 1: Student starts session
        var startHandler = new StartSessionCommandHandler(db);
        var progressDto = await startHandler.Handle(
            new StartSessionCommand(userId, sessionId), default);

        progressDto.Status.Should().Be("InProgress");
        progressDto.LastPositionSeconds.Should().Be(0);

        // Step 2: Video plays, student watches 85%
        var posHandler = new UpdateSessionVideoPositionCommandHandler(db);
        await posHandler.Handle(
            new UpdateSessionVideoPositionCommand(userId, sessionId,
                LastPositionSeconds: 408, WatchedSeconds: 408, WatchPercentage: 85.0), default);

        // Step 3: Student views a grammar segment
        var viewSegHandler = new MarkSegmentViewedCommandHandler(db);
        await viewSegHandler.Handle(new MarkSegmentViewedCommand(userId, segmentId), default);

        // Step 4: Student interacts with grammar asset (viewed)
        var interactHandler = new RecordAssetInteractionCommandHandler(db);
        await interactHandler.Handle(
            new RecordAssetInteractionCommand(userId, assetId, "Viewed", null), default);

        // Step 5: Student completes the segment
        var completeSegHandler = new CompleteSegmentCommandHandler(db);
        await completeSegHandler.Handle(new CompleteSegmentCommand(userId, segmentId), default);

        // Step 6: Student completes the session (>= 80% watched)
        var completeHandler = new CompleteSessionCommandHandler(db);
        await completeHandler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        // Assert final state
        var sessionProgress = db.SessionProgresses
            .First(p => p.UserId == userId && p.SessionId == sessionId);
        sessionProgress.Status.Should().Be(SessionProgressStatus.Completed);
        sessionProgress.CompletedAt.Should().NotBeNull();

        var segProgress = db.SegmentProgresses
            .First(p => p.UserId == userId && p.SegmentId == segmentId);
        segProgress.IsViewed.Should().BeTrue();
        segProgress.IsCompleted.Should().BeTrue();

        db.LearningAssetInteractions.Should().HaveCount(1);
    }

    [Fact]
    public async Task CompleteWithoutEnoughWatch_BlockedByBusinessRule()
    {
        var (sessionId, _, _, db) = await SetupLearningContentAsync();
        var userId = Guid.NewGuid();

        // Start session
        var startHandler = new StartSessionCommandHandler(db);
        await startHandler.Handle(new StartSessionCommand(userId, sessionId), default);

        // Only watch 30%
        var posHandler = new UpdateSessionVideoPositionCommandHandler(db);
        await posHandler.Handle(
            new UpdateSessionVideoPositionCommand(userId, sessionId, 144, 144, 30.0), default);

        // Attempt to complete — should be rejected
        var completeHandler = new CompleteSessionCommandHandler(db);
        var act = () => completeHandler.Handle(new CompleteSessionCommand(userId, sessionId), default);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*30*%*");
    }

    [Fact]
    public async Task ResumePlayback_LastPositionPreservedAcrossRequests()
    {
        var (sessionId, _, _, db) = await SetupLearningContentAsync();
        var userId = Guid.NewGuid();

        // Start session
        var startHandler = new StartSessionCommandHandler(db);
        await startHandler.Handle(new StartSessionCommand(userId, sessionId), default);

        // Watch up to position 250s
        var posHandler = new UpdateSessionVideoPositionCommandHandler(db);
        await posHandler.Handle(
            new UpdateSessionVideoPositionCommand(userId, sessionId, 250, 250, 52.0), default);

        // Simulate new session: query progress again
        var queryHandler = new GetSessionForLearningQueryHandler(db);
        var sessionDto = await queryHandler.Handle(
            new GetSessionForLearningQuery(sessionId, userId), default);

        sessionDto!.Progress!.LastPositionSeconds.Should().Be(250);
        sessionDto.Progress.WatchPercentage.Should().BeApproximately(52.0, 0.1);
        sessionDto.Progress.Status.Should().Be("InProgress");
    }

    [Fact]
    public async Task GetSessionForLearning_IncludesSegmentsAndAssets()
    {
        var (sessionId, segmentId, assetId, db) = await SetupLearningContentAsync();

        var queryHandler = new GetSessionForLearningQueryHandler(db);
        var result = await queryHandler.Handle(
            new GetSessionForLearningQuery(sessionId, null), default);

        result.Should().NotBeNull();
        result!.Segments.Should().HaveCount(1);

        var segment = result.Segments[0];
        segment.Id.Should().Be(segmentId);
        segment.StartTime.Should().Be(0);
        segment.EndTime.Should().Be(480);
        segment.Duration.Should().Be(480);    // endTime - startTime
        segment.Assets.Should().HaveCount(1);

        var asset = segment.Assets[0];
        asset.Id.Should().Be(assetId);
        asset.Type.Should().Be("GrammarBlock");
        asset.StartTime.Should().Be(60);
        asset.EndTime.Should().Be(180);       // endTime now included in DTO
    }

    [Fact]
    public async Task GetSessionForLearning_WithoutUser_HasNullProgress()
    {
        var (sessionId, _, _, db) = await SetupLearningContentAsync();

        var queryHandler = new GetSessionForLearningQueryHandler(db);
        var result = await queryHandler.Handle(
            new GetSessionForLearningQuery(sessionId, UserId: null), default);

        result.Should().NotBeNull();
        result!.Progress.Should().BeNull();
        result.Segments[0].Progress.Should().BeNull();
    }

    [Fact]
    public async Task SegmentOverlapValidation_BlocksCMSTeacherFromCreatingBadContent()
    {
        // Verify that a teacher cannot accidentally create overlapping segments
        using var db = InMemoryDbHelper.Create();
        var session = Session.Create(Guid.NewGuid(), "Test Session", null, 0);
        db.Sessions.Add(session);
        await db.SaveChangesAsync(default);

        var segHandler = new CreateSegmentCommandHandler(db);
        await segHandler.Handle(
            new CreateSegmentCommand(session.Id, "Segment 1", null, 0, 360), default);
        await segHandler.Handle(
            new CreateSegmentCommand(session.Id, "Segment 2", null, 360, 720), default);

        // Attempt to add a segment that overlaps both
        var act = () => segHandler.Handle(
            new CreateSegmentCommand(session.Id, "Bad Segment", null, 180, 540), default);

        await act.Should().ThrowAsync<ConflictException>();
    }
}
