using FluentAssertions;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Tests.Domain;

/// <summary>
/// Unit tests for LearningAsset domain entity.
/// Business spec (sections 3.4, 4, 5.3):
///   - Asset has a startTime to enable "jump-to-timestamp" on video
///   - Optional endTime for "show overlay during [startTime, endTime]"
///   - startTime >= 0, endTime >= startTime if provided
///   - startTime must be within parent segment range (enforced at handler level)
/// </summary>
public class LearningAssetTests
{
    private static readonly Guid _segId = Guid.NewGuid();

    [Theory]
    [InlineData("GrammarBlock")]
    [InlineData("VocabularyBlock")]
    [InlineData("QuizBlock")]
    [InlineData("ExerciseBlock")]
    [InlineData("PPTBlock")]
    [InlineData("NoteBlock")]
    [InlineData("FileAttachment")]
    public void Create_AllValidAssetTypes_ShouldSucceed(string typeName)
    {
        var type = Enum.Parse<LearningAssetType>(typeName);
        var asset = LearningAsset.Create(_segId, type, "Title", null, 120, null, 0);

        asset.Type.Should().Be(type);
        asset.StartTime.Should().Be(120);
        asset.EndTime.Should().BeNull();
    }

    [Fact]
    public void Create_WithEndTime_ShouldSucceed()
    {
        var asset = LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Grammar", null, startTime: 100, endTime: 250, orderIndex: 0);

        asset.StartTime.Should().Be(100);
        asset.EndTime.Should().Be(250);
    }

    [Fact]
    public void Create_NegativeStartTime_ThrowsDomainException()
    {
        var act = () => LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Title", null, startTime: -5, endTime: null, orderIndex: 0);

        act.Should().Throw<DomainException>()
            .WithMessage("*startTime must be >= 0*");
    }

    [Fact]
    public void Create_EndTimeLessThanStartTime_ThrowsDomainException()
    {
        var act = () => LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Title", null, startTime: 200, endTime: 100, orderIndex: 0);

        act.Should().Throw<DomainException>()
            .WithMessage("*endTime must be >= startTime*");
    }

    [Fact]
    public void Create_EndTimeEqualStartTime_ShouldSucceed()
    {
        // endTime == startTime is allowed (instantaneous point)
        var asset = LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Title", null, startTime: 200, endTime: 200, orderIndex: 0);

        asset.EndTime.Should().Be(200);
    }

    [Fact]
    public void Create_NullMetadata_DefaultsToEmptyJson()
    {
        var asset = LearningAsset.Create(_segId, LearningAssetType.NoteBlock,
            "Note", null, 0, null, 0, "  ");

        asset.Metadata.Should().Be("{}");
    }

    [Fact]
    public void Update_ChangesFieldsCorrectly()
    {
        var asset = LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Old", null, 0, null, 0);

        asset.Update("New Title", "description", 120, 300, "{\"key\":1}", false);

        asset.Title.Should().Be("New Title");
        asset.Description.Should().Be("description");
        asset.StartTime.Should().Be(120);
        asset.EndTime.Should().Be(300);
        asset.Metadata.Should().Be("{\"key\":1}");
        asset.IsPublic.Should().BeFalse();
    }

    [Fact]
    public void Update_InvalidEndTime_ThrowsDomainException()
    {
        var asset = LearningAsset.Create(_segId, LearningAssetType.GrammarBlock,
            "Old", null, 100, null, 0);

        var act = () => asset.Update("New", null, 200, 150, "{}", true);

        act.Should().Throw<DomainException>()
            .WithMessage("*endTime must be >= startTime*");
    }
}
