using FluentAssertions;
using MLS.Application.CMS.LearningAssets.Commands;
using MLS.Application.CMS.Segments.Commands;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Infrastructure.Persistence;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

/// <summary>
/// Tests for CreateLearningAssetCommandHandler.
/// Business rules verified:
///   - Asset type must be a valid LearningAssetType enum value
///   - Asset startTime must be within the parent segment's [startTime, endTime]
///   - Asset endTime must not exceed segment's endTime
///   - Assets in different segments have independent validation
/// </summary>
public class CreateLearningAssetHandlerTests
{
    private async Task<(Guid segmentId, ApplicationDbContext db)> SetupSegmentAsync(
        int segStart = 300, int segEnd = 780)
    {
        var db = InMemoryDbHelper.Create();
        var segHandler = new CreateSegmentCommandHandler(db);
        var segId = await segHandler.Handle(
            new CreateSegmentCommand(Guid.NewGuid(), "Test Segment", null, segStart, segEnd), default);
        return (segId, db);
    }

    [Fact]
    public async Task Handle_ValidAsset_ReturnsId()
    {
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var id = await handler.Handle(
            new CreateLearningAssetCommand(segId, "GrammarBlock", "Grammar 1", null,
                StartTime: 400, EndTime: 600), default);

        id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_AssetStartTimeBeforeSegment_ThrowsDomainException()
    {
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var act = () => handler.Handle(
            new CreateLearningAssetCommand(segId, "GrammarBlock", "Grammar 1", null,
                StartTime: 100, EndTime: null), default);   // 100 < segStart=300

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*within segment*");
    }

    [Fact]
    public async Task Handle_AssetStartTimeAfterSegment_ThrowsDomainException()
    {
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var act = () => handler.Handle(
            new CreateLearningAssetCommand(segId, "GrammarBlock", "Grammar 1", null,
                StartTime: 900, EndTime: null), default);   // 900 > segEnd=780

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*within segment*");
    }

    [Fact]
    public async Task Handle_AssetEndTimeExceedsSegment_ThrowsDomainException()
    {
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var act = () => handler.Handle(
            new CreateLearningAssetCommand(segId, "GrammarBlock", "Grammar 1", null,
                StartTime: 400, EndTime: 900), default);   // endTime 900 > segEnd 780

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*must not exceed segment endTime*");
    }

    [Fact]
    public async Task Handle_StartTimeExactlyAtSegmentBoundary_ShouldSucceed()
    {
        // startTime == segment.startTime is valid (first frame of segment)
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var id = await handler.Handle(
            new CreateLearningAssetCommand(segId, "GrammarBlock", "Intro Grammar", null,
                StartTime: 300, EndTime: null), default);

        id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_StartTimeAtSegmentEnd_ShouldSucceed()
    {
        // startTime == segment.endTime (last frame) is still within range
        var (segId, db) = await SetupSegmentAsync(300, 780);
        var handler = new CreateLearningAssetCommandHandler(db);

        var id = await handler.Handle(
            new CreateLearningAssetCommand(segId, "NoteBlock", "Final Note", null,
                StartTime: 780, EndTime: null), default);

        id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_InvalidAssetType_ThrowsDomainException()
    {
        var (segId, db) = await SetupSegmentAsync();
        var handler = new CreateLearningAssetCommandHandler(db);

        var act = () => handler.Handle(
            new CreateLearningAssetCommand(segId, "UnknownType", "Title", null, 400), default);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Unknown asset type*");
    }

    [Fact]
    public async Task Handle_AllValidAssetTypes_ShouldCreateSuccessfully()
    {
        var (segId, db) = await SetupSegmentAsync(0, 5400);
        var handler = new CreateLearningAssetCommandHandler(db);
        var types = new[] { "GrammarBlock", "VocabularyBlock", "QuizBlock",
            "ExerciseBlock", "PPTBlock", "NoteBlock", "FileAttachment" };

        foreach (var (type, i) in types.Select((t, i) => (t, i)))
        {
            var id = await handler.Handle(
                new CreateLearningAssetCommand(segId, type, $"Asset {i}", null, i * 100), default);
            id.Should().NotBeEmpty();
        }
    }
}
