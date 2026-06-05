using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum SessionProgressStatus { NotStarted, InProgress, Completed }

public class SessionProgress : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid SessionId { get; private set; }
    public SessionProgressStatus Status { get; private set; } = SessionProgressStatus.NotStarted;
    public int WatchedSeconds { get; private set; }
    public double WatchPercentage { get; private set; }
    public int LastPositionSeconds { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // Navigation
    public Session Session { get; private set; } = null!;

    private SessionProgress() { }

    public static SessionProgress Create(Guid userId, Guid sessionId)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionId = sessionId,
            Status = SessionProgressStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
        };

    public void UpdatePosition(int lastPositionSeconds, int watchedSeconds, double watchPercentage)
    {
        LastPositionSeconds = lastPositionSeconds;
        WatchedSeconds = watchedSeconds;
        WatchPercentage = watchPercentage;
        if (Status == SessionProgressStatus.NotStarted)
            Status = SessionProgressStatus.InProgress;
        SetUpdatedAt();
    }

    public void Complete()
    {
        Status = SessionProgressStatus.Completed;
        WatchPercentage = 100;
        CompletedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
