using MLS.Domain.Common;

namespace MLS.Domain.Entities;

/// <summary>
/// Tracks the last-known video playback position for a user/lesson pair.
/// Upserted every ~10 seconds by the frontend player.
/// </summary>
public class VideoTracking : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid SessionId { get; private set; }
    public int PositionSeconds { get; private set; }
    public int DurationSeconds { get; private set; }
    public DateTime LastUpdatedAt { get; private set; }

    private VideoTracking() { }

    public static VideoTracking Create(Guid userId, Guid sessionId, int positionSeconds, int durationSeconds)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionId = sessionId,
            PositionSeconds = positionSeconds,
            DurationSeconds = durationSeconds,
            LastUpdatedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

    public void Update(int positionSeconds, int durationSeconds)
    {
        PositionSeconds = positionSeconds;
        DurationSeconds = durationSeconds;
        LastUpdatedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
