using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum AssetInteractionType { Viewed, QuizPassed, QuizFailed, WordSaved, Downloaded }

public class LearningAssetInteraction : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid AssetId { get; private set; }
    public AssetInteractionType InteractionType { get; private set; }
    public int? Score { get; private set; }   // for quiz interactions

    // Navigation
    public LearningAsset Asset { get; private set; } = null!;

    private LearningAssetInteraction() { }

    public static LearningAssetInteraction Create(Guid userId, Guid assetId,
        AssetInteractionType interactionType, int? score = null)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AssetId = assetId,
            InteractionType = interactionType,
            Score = score,
            CreatedAt = DateTime.UtcNow,
        };
}
