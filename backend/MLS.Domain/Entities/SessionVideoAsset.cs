using MLS.Domain.Common;

namespace MLS.Domain.Entities;

/// <summary>
/// Separate VideoAsset for Session (Sessions have their own video, not tied to Lesson).
/// </summary>
public class SessionVideoAsset : BaseEntity
{
    public Guid SessionId { get; private set; }
    public VideoAssetStatus Status { get; private set; } = VideoAssetStatus.Pending;
    public string? HlsPath { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public int DurationSeconds { get; private set; }
    public long SizeBytes { get; private set; }
    public string? OriginalFileName { get; private set; }

    public Session Session { get; private set; } = null!;

    private SessionVideoAsset() { }

    public static SessionVideoAsset Create(Guid sessionId, string originalFileName, long sizeBytes)
        => new()
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            OriginalFileName = originalFileName,
            SizeBytes = sizeBytes,
            Status = VideoAssetStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

    public void SetProcessing() { Status = VideoAssetStatus.Processing; SetUpdatedAt(); }

    public void SetReady(string hlsPath, string? thumbnailUrl, int durationSeconds)
    {
        HlsPath = hlsPath;
        ThumbnailUrl = thumbnailUrl;
        DurationSeconds = durationSeconds;
        Status = VideoAssetStatus.Ready;
        SetUpdatedAt();
    }

    public void SetFailed() { Status = VideoAssetStatus.Failed; SetUpdatedAt(); }

    public void Reset(string originalFileName, long sizeBytes)
    {
        OriginalFileName = originalFileName;
        SizeBytes = sizeBytes;
        Status = VideoAssetStatus.Pending;
        HlsPath = null;
        ThumbnailUrl = null;
        DurationSeconds = 0;
        SetUpdatedAt();
    }
}
