using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Realtime.Queries;

// ── Get Room Info ─────────────────────────────────────────────────────────────

public record GetRoomByCodeQuery(string RoomCode) : IRequest<RoomInfoResult?>;

public record RoomInfoResult(
    Guid   RoomId,
    string RoomCode,
    string State,
    int    ParticipantCount,
    int    CurrentQuestionIndex,
    Guid   QuizId,
    string QuizTitle);

public class GetRoomByCodeHandler(IApplicationDbContext db)
    : IRequestHandler<GetRoomByCodeQuery, RoomInfoResult?>
{
    public async Task<RoomInfoResult?> Handle(GetRoomByCodeQuery query, CancellationToken ct)
    {
        var room = await db.RealtimeQuizRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.RoomCode == query.RoomCode, ct);

        if (room == null) return null;

        var quiz = await db.Quizzes.FindAsync([room.QuizId], ct);

        return new RoomInfoResult(
            room.Id,
            room.RoomCode,
            room.State.ToString(),
            room.Participants.Count,
            room.CurrentQuestionIndex,
            room.QuizId,
            quiz?.Title ?? "");
    }
}

// ── Get Leaderboard ───────────────────────────────────────────────────────────

public record GetLeaderboardQuery(Guid RoomId) : IRequest<List<LeaderboardParticipant>>;

public record LeaderboardParticipant(Guid UserId, string? DisplayName, int Score, int Rank);

public class GetLeaderboardHandler(IApplicationDbContext db)
    : IRequestHandler<GetLeaderboardQuery, List<LeaderboardParticipant>>
{
    public async Task<List<LeaderboardParticipant>> Handle(GetLeaderboardQuery query, CancellationToken ct)
    {
        var participants = await db.RoomParticipants
            .Where(p => p.RoomId == query.RoomId)
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.JoinedAt)
            .Select(p => new { p.UserId, p.Score, p.Rank })
            .ToListAsync(ct);

        var userIds = participants.Select(p => p.UserId).ToList();
        var profiles = await db.UserProfiles
            .Where(up => userIds.Contains(up.UserId))
            .Select(up => new { up.UserId, Name = up.FullName })
            .ToListAsync(ct);

        var nameMap = profiles.ToDictionary(p => p.UserId, p => p.Name);

        return participants.Select((p, i) => new LeaderboardParticipant(
            p.UserId,
            nameMap.GetValueOrDefault(p.UserId),
            p.Score,
            i + 1
        )).ToList();
    }
}
