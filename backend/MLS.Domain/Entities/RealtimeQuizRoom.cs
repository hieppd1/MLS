using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum RoomState { Waiting, Active, Paused, Ended }

public class RealtimeQuizRoom : BaseEntity
{
    public Guid      QuizId               { get; private set; }
    public string    RoomCode             { get; private set; } = string.Empty;
    public Guid      HostId               { get; private set; }
    public RoomState State                { get; private set; } = RoomState.Waiting;
    public int       CurrentQuestionIndex { get; private set; } = 0;
    public DateTime? StartedAt            { get; private set; }
    public DateTime? EndedAt              { get; private set; }

    // Navigation
    public ICollection<RoomParticipant> Participants { get; private set; } = [];

    private RealtimeQuizRoom() { }

    public static RealtimeQuizRoom Create(Guid quizId, Guid hostId, string roomCode)
    {
        return new RealtimeQuizRoom
        {
            Id       = Guid.NewGuid(),
            QuizId   = quizId,
            HostId   = hostId,
            RoomCode = roomCode,
            State    = RoomState.Waiting
        };
    }

    public void Start()
    {
        State     = RoomState.Active;
        StartedAt = DateTime.UtcNow;
    }

    public void End()
    {
        State  = RoomState.Ended;
        EndedAt = DateTime.UtcNow;
    }

    public void SetQuestionIndex(int index)
    {
        CurrentQuestionIndex = index;
        SetUpdatedAt();
    }
}

public class RoomParticipant : BaseEntity
{
    public Guid   RoomId      { get; private set; }
    public Guid   UserId      { get; private set; }
    public int    Score       { get; private set; } = 0;
    public int    Rank        { get; private set; } = 0;
    public bool   IsConnected { get; private set; } = true;
    public DateTime JoinedAt  { get; private set; }

    // Navigation
    public RealtimeQuizRoom Room { get; private set; } = null!;

    private RoomParticipant() { }

    public static RoomParticipant Create(Guid roomId, Guid userId)
    {
        return new RoomParticipant
        {
            Id          = Guid.NewGuid(),
            RoomId      = roomId,
            UserId      = userId,
            IsConnected = true,
            JoinedAt    = DateTime.UtcNow
        };
    }

    public void AddScore(int points)
    {
        Score += points;
        SetUpdatedAt();
    }

    public void SetRank(int rank)
    {
        Rank = rank;
        SetUpdatedAt();
    }

    public void SetConnected(bool connected)
    {
        IsConnected = connected;
        SetUpdatedAt();
    }
}
