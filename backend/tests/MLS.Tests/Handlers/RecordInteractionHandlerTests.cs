using FluentAssertions;
using MLS.Application.Learning.Commands;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

/// <summary>
/// Tests for RecordAssetInteractionCommandHandler.
/// Business rules verified:
///   - InteractionType must be a valid AssetInteractionType enum value
///   - Score is optional (quiz-only field)
///   - All valid interaction types should record successfully
/// </summary>
public class RecordInteractionHandlerTests
{
    [Theory]
    [InlineData("Viewed", null)]
    [InlineData("QuizPassed", 95)]
    [InlineData("QuizFailed", 40)]
    [InlineData("WordSaved", null)]
    [InlineData("Downloaded", null)]
    public async Task Handle_ValidInteractionType_RecordsInteraction(string type, int? score)
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new RecordAssetInteractionCommandHandler(db);

        await handler.Handle(
            new RecordAssetInteractionCommand(Guid.NewGuid(), Guid.NewGuid(), type, score), default);

        db.LearningAssetInteractions.Should().HaveCount(1);
        db.LearningAssetInteractions.First().InteractionType
            .Should().Be(Enum.Parse<AssetInteractionType>(type));
    }

    [Fact]
    public async Task Handle_InvalidInteractionType_ThrowsDomainException()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new RecordAssetInteractionCommandHandler(db);

        var act = () => handler.Handle(
            new RecordAssetInteractionCommand(Guid.NewGuid(), Guid.NewGuid(),
                "UnknownType", null), default);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*Unknown interaction type*");
    }

    [Fact]
    public async Task Handle_EmptyInteractionType_ThrowsDomainException()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new RecordAssetInteractionCommandHandler(db);

        var act = () => handler.Handle(
            new RecordAssetInteractionCommand(Guid.NewGuid(), Guid.NewGuid(), "", null), default);

        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Handle_MultipleInteractions_AllPersisted()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new RecordAssetInteractionCommandHandler(db);
        var assetId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        await handler.Handle(new RecordAssetInteractionCommand(userId, assetId, "Viewed", null), default);
        await handler.Handle(new RecordAssetInteractionCommand(userId, assetId, "QuizPassed", 85), default);

        db.LearningAssetInteractions.Should().HaveCount(2);
    }
}
