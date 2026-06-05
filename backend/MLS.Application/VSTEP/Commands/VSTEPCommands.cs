using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Application.VSTEP.Queries;
using MLS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MLS.Application.VSTEP.Commands;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record VSTEPSessionDto(
    Guid    Id,
    Guid    UserId,
    string? TargetBand,
    string  CurrentPart,
    Dictionary<string, string> PartState,
    decimal? ListeningScore,
    decimal? ReadingScore,
    decimal? WritingScore,
    decimal? SpeakingScore,
    decimal? OverallScore,
    string? AssignedBand,
    int?    AssignedLevel,
    Guid?   ListeningAttemptId,
    Guid?   ReadingAttemptId,
    Guid?   WritingAttemptId,
    Guid?   SpeakingAttemptId,
    bool    IsCompleted,
    DateTime StartedAt,
    DateTime? CompletedAt);

public record VSTEPBandResultDto(
    Guid    Id,
    string  AssignedBand,
    int     AssignedLevel,
    decimal ListeningScore,
    decimal ReadingScore,
    decimal WritingScore,
    decimal SpeakingScore,
    decimal OverallScore,
    DateTime TestedAt);

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateVSTEPSessionCommand(Guid UserId, string? TargetBand) : IRequest<VSTEPSessionDto>;

public class CreateVSTEPSessionHandler(IApplicationDbContext db)
    : IRequestHandler<CreateVSTEPSessionCommand, VSTEPSessionDto>
{
    public async Task<VSTEPSessionDto> Handle(CreateVSTEPSessionCommand cmd, CancellationToken ct)
    {
        var session = VSTEPSession.Create(cmd.UserId, cmd.TargetBand);
        db.VSTEPSessions.Add(session);
        await db.SaveChangesAsync(ct);
        return VSTEPCommandsHelpers.ToDtoQ(session);
    }
}

public record StartVSTEPPartCommand(Guid SessionId, Guid UserId, string Part, Guid QuizId) : IRequest<StartVSTEPPartResult>;

public record StartVSTEPPartResult(Guid AttemptId, VSTEPSessionDto Session);

public class StartVSTEPPartHandler(IApplicationDbContext db)
    : IRequestHandler<StartVSTEPPartCommand, StartVSTEPPartResult>
{
    private static readonly string[] ValidParts = ["Listening", "Reading", "Writing", "Speaking"];

    public async Task<StartVSTEPPartResult> Handle(StartVSTEPPartCommand cmd, CancellationToken ct)
    {
        if (!ValidParts.Contains(cmd.Part))
            throw new ArgumentException($"Invalid VSTEP part: {cmd.Part}");

        var session = await db.VSTEPSessions.FirstOrDefaultAsync(
            s => s.Id == cmd.SessionId && s.UserId == cmd.UserId, ct)
            ?? throw new KeyNotFoundException($"VSTEP session {cmd.SessionId} not found");

        if (session.IsCompleted)
            throw new InvalidOperationException("VSTEP session is already completed");

        // Create a QuizAttempt for this part
        var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.Id == cmd.QuizId, ct)
            ?? throw new KeyNotFoundException($"Quiz {cmd.QuizId} not found");

        // Count existing attempts for this quiz by this user
        var attemptNumber = await db.QuizAttempts
            .CountAsync(a => a.QuizId == cmd.QuizId && a.UserId == cmd.UserId, ct) + 1;

        var attempt = QuizAttempt.Create(cmd.QuizId, cmd.UserId, attemptNumber, durationSeconds: quiz.Duration);
        db.QuizAttempts.Add(attempt);

        session.StartPart(cmd.Part, attempt.Id);
        await db.SaveChangesAsync(ct);

        return new StartVSTEPPartResult(attempt.Id, VSTEPCommandsHelpers.ToDtoQ(session));
    }
}

public record SubmitVSTEPPartCommand(Guid SessionId, Guid UserId, string Part, decimal Score) : IRequest<VSTEPSessionDto>;

public class SubmitVSTEPPartHandler(IApplicationDbContext db)
    : IRequestHandler<SubmitVSTEPPartCommand, VSTEPSessionDto>
{
    public async Task<VSTEPSessionDto> Handle(SubmitVSTEPPartCommand cmd, CancellationToken ct)
    {
        var session = await db.VSTEPSessions.FirstOrDefaultAsync(
            s => s.Id == cmd.SessionId && s.UserId == cmd.UserId, ct)
            ?? throw new KeyNotFoundException($"VSTEP session {cmd.SessionId} not found");

        session.SetPartScore(cmd.Part, cmd.Score);

        // Check if all 4 parts are graded — compute final band
        var partState = session.ParsePartState();
        var allGraded = new[] { "listening", "reading", "writing", "speaking" }
            .All(p => partState.TryGetValue(p, out var s) && s == "Graded");

        if (allGraded)
        {
            var (band, level) = ComputeBand(
                session.ListeningScore ?? 0,
                session.ReadingScore   ?? 0,
                session.WritingScore   ?? 0,
                session.SpeakingScore  ?? 0);

            var overall = (
                (session.ListeningScore ?? 0) +
                (session.ReadingScore   ?? 0) +
                (session.WritingScore   ?? 0) +
                (session.SpeakingScore  ?? 0)) / 4m;

            session.Complete(band, level, Math.Round(overall, 2));

            var result = VSTEPBandResult.Create(
                cmd.UserId,
                session.Id,
                band, level,
                session.ListeningScore ?? 0,
                session.ReadingScore   ?? 0,
                session.WritingScore   ?? 0,
                session.SpeakingScore  ?? 0);

            db.VSTEPBandResults.Add(result);
        }

        await db.SaveChangesAsync(ct);
        return VSTEPCommandsHelpers.ToDtoQ(session);
    }

    private static (string Band, int Level) ComputeBand(
        decimal listening, decimal reading, decimal writing, decimal speaking)
    {
        var overall = (listening + reading + writing + speaking) / 4m;
        var minScore = Math.Min(Math.Min(listening, reading), Math.Min(writing, speaking));

        if (overall >= 8.0m && minScore >= 6.0m) return ("C1", 5);
        if (overall >= 6.0m && minScore >= 4.0m) return ("B2", 4);
        if (overall >= 4.0m) return ("B1", 3);
        if (overall >= 2.5m) return ("A2", 2);
        return ("BelowA2", 1);
    }
}

// ── DTO Helper (shared) ──────────────────────────────────────────────────────

public static class VSTEPCommandsHelpers
{
    public static VSTEPSessionDto ToDtoQ(VSTEPSession s) => new(
        s.Id, s.UserId, s.TargetBand, s.CurrentPart,
        s.ParsePartState(),
        s.ListeningScore, s.ReadingScore, s.WritingScore, s.SpeakingScore, s.OverallScore,
        s.AssignedBand, s.AssignedLevel,
        s.ListeningAttemptId, s.ReadingAttemptId, s.WritingAttemptId, s.SpeakingAttemptId,
        s.IsCompleted, s.StartedAt, s.CompletedAt);
}

// ── PassageGroup CRUD Commands ────────────────────────────────────────────────

public record CreatePassageGroupCommand(
    Guid   QuizId,
    int    GroupIndex,
    string PassageType,
    string? PassageText,
    string? AudioUrl,
    int    AudioPlayLimit,
    int    PreListenSeconds,
    Guid[] QuestionIds,
    int    DisplayOrder) : IRequest<PassageGroupDto>;

public class CreatePassageGroupHandler(IApplicationDbContext db)
    : IRequestHandler<CreatePassageGroupCommand, PassageGroupDto>
{
    public async Task<PassageGroupDto> Handle(CreatePassageGroupCommand cmd, CancellationToken ct)
    {
        var pg = PassageGroup.Create(
            cmd.QuizId, cmd.GroupIndex, cmd.PassageType,
            cmd.PassageText, cmd.AudioUrl,
            cmd.QuestionIds, cmd.DisplayOrder,
            cmd.AudioPlayLimit, cmd.PreListenSeconds);

        db.PassageGroups.Add(pg);
        await db.SaveChangesAsync(ct);
        return ToDto(pg);
    }

    internal static PassageGroupDto ToDto(PassageGroup pg)
    {
        var ids = System.Text.Json.JsonSerializer.Deserialize<Guid[]>(pg.QuestionIds) ?? [];
        return new PassageGroupDto(
            pg.Id, pg.QuizId, pg.GroupIndex, pg.PassageType,
            pg.PassageText, pg.AudioUrl, pg.AudioPlayLimit,
            pg.PreListenSeconds, ids, pg.DisplayOrder);
    }
}

public record UpdatePassageGroupCommand(
    Guid   Id,
    string PassageType,
    string? PassageText,
    string? AudioUrl,
    int    AudioPlayLimit,
    int    PreListenSeconds,
    Guid[] QuestionIds,
    int    DisplayOrder) : IRequest<PassageGroupDto>;

public class UpdatePassageGroupHandler(IApplicationDbContext db)
    : IRequestHandler<UpdatePassageGroupCommand, PassageGroupDto>
{
    public async Task<PassageGroupDto> Handle(UpdatePassageGroupCommand cmd, CancellationToken ct)
    {
        var pg = await db.PassageGroups.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException($"PassageGroup {cmd.Id} not found");

        pg.Update(cmd.PassageText, cmd.AudioUrl, cmd.QuestionIds, cmd.PassageType);

        await db.SaveChangesAsync(ct);
        return CreatePassageGroupHandler.ToDto(pg);
    }
}

public record DeletePassageGroupCommand(Guid Id) : IRequest;

public class DeletePassageGroupHandler(IApplicationDbContext db)
    : IRequestHandler<DeletePassageGroupCommand>
{
    public async Task Handle(DeletePassageGroupCommand cmd, CancellationToken ct)
    {
        var pg = await db.PassageGroups.FindAsync([cmd.Id], ct)
            ?? throw new KeyNotFoundException($"PassageGroup {cmd.Id} not found");
        db.PassageGroups.Remove(pg);
        await db.SaveChangesAsync(ct);
    }
}
