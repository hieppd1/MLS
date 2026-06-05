using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Realtime.Commands;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record RoomInfoDto(
    Guid   RoomId,
    string RoomCode,
    string State,
    int    ParticipantCount,
    int    CurrentQuestionIndex);

public record ParticipantDto(
    Guid   UserId,
    string? DisplayName,
    int    Score,
    int    Rank,
    bool   IsConnected);

public record LeaderboardDto(List<LeaderboardEntryDto> Entries);
public record LeaderboardEntryDto(string UserId, string? DisplayName, long Score, long Rank);

public record QuestionOptionPayload(Guid Id, string Content, int DisplayOrder);
public record QuestionPayload(
    int    QuestionIndex,
    Guid   QuestionId,
    string Content,
    string Type,
    string? AudioUrl,
    string? ImageUrl,
    IEnumerable<QuestionOptionPayload> Options,
    int    TimeLimitSec,
    int    Score);

public record StartRoomResult(QuestionPayload? Question);
public record NextRoomResult(bool IsEnded, QuestionPayload? Question);

// ── Create Room ───────────────────────────────────────────────────────────────

public record CreateRoomCommand(Guid QuizId, Guid HostId) : IRequest<RoomInfoDto>;

public class CreateRoomHandler(IApplicationDbContext db) : IRequestHandler<CreateRoomCommand, RoomInfoDto>
{
    public async Task<RoomInfoDto> Handle(CreateRoomCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FindAsync([cmd.QuizId], ct)
            ?? throw new InvalidOperationException("Quiz not found.");

        if (quiz.Status != QuizStatus.Published)
            throw new InvalidOperationException("Quiz is not published.");

        // Generate unique 6-char code
        string code;
        do {
            code = GenerateCode();
        } while (await db.RealtimeQuizRooms.AnyAsync(r => r.RoomCode == code, ct));

        var room = RealtimeQuizRoom.Create(cmd.QuizId, cmd.HostId, code);
        db.RealtimeQuizRooms.Add(room);
        await db.SaveChangesAsync(ct);

        return new RoomInfoDto(room.Id, room.RoomCode, room.State.ToString(), 0, 0);
    }

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var rng = new Random();
        return new string(Enumerable.Range(0, 6).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
    }
}

// ── Join Room ─────────────────────────────────────────────────────────────────

public record JoinRoomCommand(string RoomCode, Guid UserId) : IRequest<RoomInfoDto>;

public class JoinRoomHandler(
    IApplicationDbContext db,
    IQuizNotificationService notifier)
    : IRequestHandler<JoinRoomCommand, RoomInfoDto>
{
    public async Task<RoomInfoDto> Handle(JoinRoomCommand cmd, CancellationToken ct)
    {
        var room = await db.RealtimeQuizRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.RoomCode == cmd.RoomCode, ct)
            ?? throw new InvalidOperationException("Room not found.");

        if (room.State == RoomState.Ended)
            throw new InvalidOperationException("Room has already ended.");

        // Idempotent: re-join
        var existing = room.Participants.FirstOrDefault(p => p.UserId == cmd.UserId);
        if (existing == null)
        {
            var participant = RoomParticipant.Create(room.Id, cmd.UserId);
            db.RoomParticipants.Add(participant);
            await db.SaveChangesAsync(ct);

            // Notify all room members
            await notifier.NotifyRoomAsync(room.RoomCode, "ParticipantJoined",
                new { userId = cmd.UserId }, ct);
        }

        var count = await db.RoomParticipants.CountAsync(p => p.RoomId == room.Id, ct);
        return new RoomInfoDto(room.Id, room.RoomCode, room.State.ToString(), count, room.CurrentQuestionIndex);
    }
}

// ── Start Room ────────────────────────────────────────────────────────────────

public record StartRoomCommand(Guid RoomId, Guid HostId) : IRequest<StartRoomResult>;

public class StartRoomHandler(
    IApplicationDbContext db,
    IQuizNotificationService notifier)
    : IRequestHandler<StartRoomCommand, StartRoomResult>
{
    public async Task<StartRoomResult> Handle(StartRoomCommand cmd, CancellationToken ct)
    {
        var room = await db.RealtimeQuizRooms
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Id == cmd.RoomId, ct)
            ?? throw new InvalidOperationException("Room not found.");

        if (room.HostId != cmd.HostId)
            throw new UnauthorizedAccessException("Only the host can start the room.");

        if (room.State != RoomState.Waiting)
            throw new InvalidOperationException("Room is not in Waiting state.");

        room.Start();
        await db.SaveChangesAsync(ct);

        // Load first question
        var firstQuestion = await GetQuestionAtIndexAsync(db, room.QuizId, 0, ct);

        await notifier.NotifyRoomAsync(room.RoomCode, "RoomStateChanged",
            new { state = "Active", roomCode = room.RoomCode }, ct);

        if (firstQuestion != null)
            await notifier.NotifyRoomAsync(room.RoomCode, "QuestionStarted", firstQuestion, ct);

        return new StartRoomResult(firstQuestion);
    }

    internal static async Task<QuestionPayload?> GetQuestionAtIndexAsync(
        IApplicationDbContext db, Guid quizId, int index, CancellationToken ct)
    {
        var qq = await db.QuizQuestions
            .Include(q => q.Question).ThenInclude(q => q.Options)
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.DisplayOrder)
            .Skip(index)
            .FirstOrDefaultAsync(ct);

        if (qq == null) return null;

        return new QuestionPayload(
            QuestionIndex: index,
            QuestionId:    qq.Question.Id,
            Content:       qq.Question.Content,
            Type:          qq.Question.Type.ToString(),
            AudioUrl:      qq.Question.AudioUrl,
            ImageUrl:      qq.Question.ImageUrl,
            Options:       qq.Question.Options
                .OrderBy(o => o.DisplayOrder)
                .Select(o => new QuestionOptionPayload(o.Id, o.Content, o.DisplayOrder)),
            TimeLimitSec:  20,
            Score:         (int)qq.Score);
    }
}

// ── Next Question (Host advances) ─────────────────────────────────────────────

public record NextQuestionCommand(Guid RoomId, Guid HostId) : IRequest<NextRoomResult>;

public class NextQuestionHandler(
    IApplicationDbContext db,
    IQuizNotificationService notifier)
    : IRequestHandler<NextQuestionCommand, NextRoomResult>
{
    public async Task<NextRoomResult> Handle(NextQuestionCommand cmd, CancellationToken ct)
    {
        var room = await db.RealtimeQuizRooms
            .FirstOrDefaultAsync(r => r.Id == cmd.RoomId, ct)
            ?? throw new InvalidOperationException("Room not found.");

        if (room.HostId != cmd.HostId)
            throw new UnauthorizedAccessException("Only the host can advance questions.");

        var totalQuestions = await db.QuizQuestions.CountAsync(q => q.QuizId == room.QuizId, ct);
        var nextIndex = room.CurrentQuestionIndex + 1;

        if (nextIndex >= totalQuestions)
        {
            // End the quiz
            room.End();
            await db.SaveChangesAsync(ct);
            await notifier.NotifyRoomAsync(room.RoomCode, "QuizEnded",
                new { roomCode = room.RoomCode }, ct);
            return new NextRoomResult(IsEnded: true, Question: null);
        }

        room.SetQuestionIndex(nextIndex);
        await db.SaveChangesAsync(ct);

        var nextQuestion = await StartRoomHandler.GetQuestionAtIndexAsync(db, room.QuizId, nextIndex, ct);

        if (nextQuestion != null)
            await notifier.NotifyRoomAsync(room.RoomCode, "QuestionStarted", nextQuestion, ct);

        return new NextRoomResult(IsEnded: false, Question: nextQuestion);
    }
}

// ── Submit Realtime Answer ─────────────────────────────────────────────────────

public record SubmitRealtimeAnswerCommand(
    Guid   RoomId,
    Guid   UserId,
    Guid   QuestionId,
    Guid?  SelectedOptionId,
    long   TimeTakenMs) : IRequest<RealtimeAnswerResult>;

public record RealtimeAnswerResult(bool IsCorrect, int PointsEarned, long TotalScore);

public class SubmitRealtimeAnswerHandler(
    IApplicationDbContext db,
    IRealtimeLeaderboardService leaderboard,
    IQuizNotificationService notifier)
    : IRequestHandler<SubmitRealtimeAnswerCommand, RealtimeAnswerResult>
{
    private const int BasePoints  = 500;
    private const int SpeedBonus  = 500;
    private const int TimeLimitMs = 20_000;

    public async Task<RealtimeAnswerResult> Handle(SubmitRealtimeAnswerCommand cmd, CancellationToken ct)
    {
        var room = await db.RealtimeQuizRooms
            .FirstOrDefaultAsync(r => r.Id == cmd.RoomId, ct)
            ?? throw new InvalidOperationException("Room not found.");

        if (room.State != RoomState.Active)
            return new RealtimeAnswerResult(false, 0, 0);

        // Check correct answer
        bool isCorrect = false;
        if (cmd.SelectedOptionId.HasValue)
        {
            isCorrect = await db.QuestionOptions
                .AnyAsync(o => o.Id == cmd.SelectedOptionId.Value
                             && o.QuestionId == cmd.QuestionId
                             && o.IsCorrect, ct);
        }

        int points = 0;
        if (isCorrect)
        {
            var timeFraction = Math.Max(0, (TimeLimitMs - cmd.TimeTakenMs) / (double)TimeLimitMs);
            points = BasePoints + (int)(SpeedBonus * timeFraction);
        }

        // Update DB participant score
        var participant = await db.RoomParticipants
            .FirstOrDefaultAsync(p => p.RoomId == cmd.RoomId && p.UserId == cmd.UserId, ct);

        if (participant != null && points > 0)
        {
            participant.AddScore(points);
            await db.SaveChangesAsync(ct);
        }

        // Update Redis leaderboard
        if (points > 0)
            await leaderboard.AddScoreAsync(cmd.RoomId.ToString(), cmd.UserId.ToString(), points);

        // Get updated leaderboard
        var top10 = await leaderboard.GetTopAsync(cmd.RoomId.ToString(), 10);

        // Push leaderboard update to room
        await notifier.NotifyRoomAsync(room.RoomCode, "LeaderboardUpdate", new {
            entries = top10.Select(e => new {
                userId = e.UserId,
                score  = e.Score,
                rank   = e.Rank
            })
        }, ct);

        var totalScore = await leaderboard.GetScoreAsync(cmd.RoomId.ToString(), cmd.UserId.ToString()) ?? 0;

        return new RealtimeAnswerResult(isCorrect, points, totalScore);
    }
}
