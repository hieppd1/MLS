using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.OPIC.Commands;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record OPICTopicSurveyDto(
    Guid   Id,
    string Language,
    string[] SelectedTopics,
    string? TargetLevel,
    int    ChosenDifficulty,
    DateTime CreatedAt);

public record OPICSessionDto(
    Guid   Id,
    string Language,
    string SessionState,
    int    ChosenDifficulty,
    string? MidAdjustChoice,
    int?   FinalDifficulty,
    string? OPICLevelResult,
    decimal? OverallScore,
    bool   IsCompleted,
    DateTime StartedAt,
    int    QuestionsDone,
    Guid?  QuizId = null);   // count of AttemptRefs

public record OPICSessionDetailDto(
    Guid   Id,
    string Language,
    string SessionState,
    int    ChosenDifficulty,
    string? MidAdjustChoice,
    int?   FinalDifficulty,
    string? OPICLevelResult,
    decimal? OverallScore,
    bool   IsCompleted,
    DateTime StartedAt,
    DateTime? CompletedAt,
    OPICComboGroupDto[] Combos,
    OPICAttemptRefDto[] AttemptRefs,
    Guid?  QuizId = null);

public record OPICComboGroupDto(
    Guid   Id,
    int    ComboIndex,
    string TopicCategory,
    string TopicType,
    Guid[] QuestionIds);

public record OPICAttemptRefDto(
    Guid AttemptId,
    int  QuestionIndex);

public record OPICLevelResultDto(
    Guid    Id,
    string  AssignedLevel,
    decimal OverallScore,
    decimal PronunciationScore,
    decimal FluencyScore,
    decimal CoherenceScore,
    decimal VocabularyScore,
    decimal TaskAchievementScore,
    string? StrongestSkill,
    string? WeakestSkill,
    string? ImprovementAdvice,
    DateTime TestedAt);

public record OPICScriptTemplateDto(
    Guid    Id,
    string  TopicCategory,
    string  ComboType,
    string? TargetLevel,
    string  Language,
    string  OpeningTemplate,
    string  BodyTemplate,
    string  ClosingTemplate,
    bool    IsPublished);

// ── Commands ──────────────────────────────────────────────────────────────────

public record SaveSurveyCommand(
    Guid     UserId,
    string[] SelectedTopics,
    string?  TargetLevel,
    int      ChosenDifficulty,
    string   Language = "vi") : IRequest<OPICTopicSurveyDto>;

public class SaveSurveyHandler(IApplicationDbContext db)
    : IRequestHandler<SaveSurveyCommand, OPICTopicSurveyDto>
{
    public async Task<OPICTopicSurveyDto> Handle(SaveSurveyCommand cmd, CancellationToken ct)
    {
        // Upsert: one survey per user+language
        var existing = db.OPICTopicSurveys
            .Where(s => s.UserId == cmd.UserId && s.Language == cmd.Language)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (existing is not null)
        {
            existing.Update(cmd.SelectedTopics, cmd.TargetLevel, cmd.ChosenDifficulty);
        }
        else
        {
            existing = OPICTopicSurvey.Create(
                cmd.UserId, cmd.SelectedTopics, cmd.TargetLevel,
                cmd.ChosenDifficulty, cmd.Language);
            db.OPICTopicSurveys.Add(existing);
        }

        await db.SaveChangesAsync(ct);
        return ToDto(existing);
    }

    private static OPICTopicSurveyDto ToDto(OPICTopicSurvey s) => new(
        s.Id, s.Language,
        System.Text.Json.JsonSerializer.Deserialize<string[]>(s.SelectedTopics) ?? [],
        s.TargetLevel, s.ChosenDifficulty, s.CreatedAt);
}

// ─────────────────────────────────────────────────────────────────────────────

public record CreateSessionCommand(
    Guid    UserId,
    Guid?   SurveyId,
    int     ChosenDifficulty,
    string  Language = "vi",
    Guid?   QuizId   = null) : IRequest<OPICSessionDto>;

public class CreateSessionHandler(IApplicationDbContext db)
    : IRequestHandler<CreateSessionCommand, OPICSessionDto>
{
    public async Task<OPICSessionDto> Handle(CreateSessionCommand cmd, CancellationToken ct)
    {
        var session = OPICSession.Create(
            cmd.UserId, cmd.SurveyId, cmd.ChosenDifficulty, cmd.Language, cmd.QuizId);
        db.OPICSessions.Add(session);
        await db.SaveChangesAsync(ct);
        return ToDto(session, 0);
    }

    internal static OPICSessionDto ToDto(OPICSession s, int questionsDone) => new(
        s.Id, s.Language, s.SessionState, s.ChosenDifficulty,
        s.MidAdjustChoice, s.FinalDifficulty, s.OPICLevelResult,
        s.OverallScore, s.IsCompleted, s.StartedAt, questionsDone, s.QuizId);
}

// ─────────────────────────────────────────────────────────────────────────────

public record MidAdjustCommand(
    Guid   SessionId,
    Guid   UserId,
    string Choice) : IRequest<OPICSessionDto>;   // Choice: "easier"|"same"|"harder"

public class MidAdjustHandler(IApplicationDbContext db)
    : IRequestHandler<MidAdjustCommand, OPICSessionDto>
{
    public async Task<OPICSessionDto> Handle(MidAdjustCommand cmd, CancellationToken ct)
    {
        var session = await db.OPICSessions.FindAsync([cmd.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {cmd.SessionId} not found");

        if (session.UserId != cmd.UserId)
            throw new UnauthorizedAccessException();

        if (!new[] { "easier", "same", "harder" }.Contains(cmd.Choice))
            throw new ArgumentException($"Invalid choice: {cmd.Choice}");

        session.SetMidAdjust(cmd.Choice);
        session.AdvanceTo("Session2");
        await db.SaveChangesAsync(ct);

        var refCount = db.OPICAttemptRefs.Count(r => r.SessionId == cmd.SessionId);
        return CreateSessionHandler.ToDto(session, refCount);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

public record RecordAttemptRefCommand(
    Guid SessionId,
    Guid AttemptId,
    int  QuestionIndex) : IRequest;

public class RecordAttemptRefHandler(IApplicationDbContext db)
    : IRequestHandler<RecordAttemptRefCommand>
{
    public async Task Handle(RecordAttemptRefCommand cmd, CancellationToken ct)
    {
        // Idempotent — skip if already recorded
        bool exists = db.OPICAttemptRefs.Any(r =>
            r.SessionId == cmd.SessionId && r.QuestionIndex == cmd.QuestionIndex);
        if (exists) return;

        db.OPICAttemptRefs.Add(OPICAttemptRef.Create(
            cmd.SessionId, cmd.AttemptId, cmd.QuestionIndex));
        await db.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Finalize an OPIC session: aggregate speaking scores → calculate level → persist result.
/// Called after all 15 questions are graded (triggered by worker or manual teacher override).
/// </summary>
public record FinalizeSessionCommand(
    Guid   SessionId,
    Guid   UserId) : IRequest<OPICLevelResultDto>;

public class FinalizeSessionHandler(IApplicationDbContext db)
    : IRequestHandler<FinalizeSessionCommand, OPICLevelResultDto>
{
    public async Task<OPICLevelResultDto> Handle(FinalizeSessionCommand cmd, CancellationToken ct)
    {
        var session = await db.OPICSessions.FindAsync([cmd.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {cmd.SessionId} not found");

        if (session.UserId != cmd.UserId)
            throw new UnauthorizedAccessException();

        // Gather all speaking submissions for this session (via attempt refs)
        var attemptIds = db.OPICAttemptRefs
            .Where(r => r.SessionId == cmd.SessionId)
            .Select(r => r.AttemptId)
            .ToList();

        var answers = db.AttemptAnswers
            .Where(a => attemptIds.Contains(a.AttemptId))
            .ToList();

        var answerIds = answers.Select(a => a.Id).ToList();

        var submissions = db.SpeakingSubmissions
            .Where(s => answerIds.Contains(s.AttemptAnswerId)
                     && s.GradingStatus == Domain.Entities.SpeakingGradingStatus.Done)
            .ToList();

        if (submissions.Count == 0)
            throw new InvalidOperationException("No graded speaking submissions found for this session.");

        // Aggregate scores (average over all graded submissions)
        var aggregate = new Services.OPICScoreAggregate(
            PronunciationAvg:   (decimal)(submissions.Average(s => (double?)s.PronunciationScore) ?? 0),
            FluencyAvg:         (decimal)(submissions.Average(s => (double?)s.FluencyScore) ?? 0),
            CoherenceAvg:       (decimal)(submissions.Average(s => (double?)s.CoherenceScore) ?? 0),
            VocabularyAvg:      (decimal)(submissions.Average(s => (double?)s.VocabularyScore) ?? 0),
            TaskAchievementAvg: (decimal)(submissions.Average(s => (double?)s.TaskAchievementScore) ?? 0));

        var engineResult = Services.OPICLevelEngine.Calculate(aggregate, session.ChosenDifficulty);
        var advice = Services.OPICLevelEngine.BuildImprovementAdvice(
            engineResult.WeakestSkill, engineResult.AssignedLevel);

        // Persist result
        var levelResult = OPICLevelResult.Create(
            userId:          session.UserId,
            sessionId:       session.Id,
            assignedLevel:   engineResult.AssignedLevel,
            overallScore:    engineResult.OverallScore,
            pronunciation:   aggregate.PronunciationAvg,
            fluency:         aggregate.FluencyAvg,
            coherence:       aggregate.CoherenceAvg,
            vocabulary:      aggregate.VocabularyAvg,
            taskAchievement: aggregate.TaskAchievementAvg,
            justification:   null,
            strongestSkill:  engineResult.StrongestSkill,
            weakestSkill:    engineResult.WeakestSkill,
            improvementAdvice: advice,
            language:        session.Language);

        db.OPICLevelResults.Add(levelResult);
        session.Complete(engineResult.AssignedLevel, engineResult.OverallScore);
        await db.SaveChangesAsync(ct);

        return ToDto(levelResult);
    }

    internal static OPICLevelResultDto ToDto(OPICLevelResult r) => new(
        r.Id, r.AssignedLevel, r.OverallScore,
        r.PronunciationScore, r.FluencyScore, r.CoherenceScore,
        r.VocabularyScore, r.TaskAchievementScore,
        r.StrongestSkill, r.WeakestSkill, r.ImprovementAdvice, r.TestedAt);
}

// ── Script Template Commands ──────────────────────────────────────────────────

public record CreateScriptTemplateCommand(
    Guid    CreatedBy,
    string  TopicCategory,
    string  ComboType,
    string  OpeningTemplate,
    string  BodyTemplate,
    string  ClosingTemplate,
    string? TargetLevel  = null,
    string? VocabList    = null,
    string? UsefulPhrases = null,
    string  Language     = "vi") : IRequest<OPICScriptTemplateDto>;

public class CreateScriptTemplateHandler(IApplicationDbContext db)
    : IRequestHandler<CreateScriptTemplateCommand, OPICScriptTemplateDto>
{
    public async Task<OPICScriptTemplateDto> Handle(CreateScriptTemplateCommand cmd, CancellationToken ct)
    {
        var template = OPICScriptTemplate.Create(
            cmd.CreatedBy, cmd.TopicCategory, cmd.ComboType,
            cmd.OpeningTemplate, cmd.BodyTemplate, cmd.ClosingTemplate,
            cmd.TargetLevel, cmd.Language);
        template.UpdateContent(cmd.OpeningTemplate, cmd.BodyTemplate, cmd.ClosingTemplate,
            cmd.VocabList, cmd.UsefulPhrases);

        db.OPICScriptTemplates.Add(template);
        await db.SaveChangesAsync(ct);
        return ToDto(template);
    }

    internal static OPICScriptTemplateDto ToDto(OPICScriptTemplate t) => new(
        t.Id, t.TopicCategory, t.ComboType, t.TargetLevel, t.Language,
        t.OpeningTemplate, t.BodyTemplate, t.ClosingTemplate, t.IsPublished);
}

// ── Simulate Complete (bypass AI grading for demo/test) ───────────────────────

/// <summary>
/// Demo-mode finalize: auto-generate mock scores from chosen difficulty,
/// run the level engine, and complete the session — no real AI grading needed.
/// </summary>
public record SimulateCompleteCommand(
    Guid SessionId,
    Guid UserId) : IRequest<OPICLevelResultDto>;

public class SimulateCompleteHandler(IApplicationDbContext db)
    : IRequestHandler<SimulateCompleteCommand, OPICLevelResultDto>
{
    // Base score by difficulty (1–6) and per-skill jitter
    private static readonly decimal[] BaseMeans = [0, 27m, 37m, 51m, 63m, 74m, 83m];
    private static readonly Random   Rng        = new();

    public async Task<OPICLevelResultDto> Handle(SimulateCompleteCommand cmd, CancellationToken ct)
    {
        var session = await db.OPICSessions.FindAsync([cmd.SessionId], ct)
            ?? throw new KeyNotFoundException($"Session {cmd.SessionId} not found");

        if (session.UserId != cmd.UserId)
            throw new UnauthorizedAccessException();

        if (session.IsCompleted)
            throw new InvalidOperationException("Session is already completed.");

        // Determine effective difficulty
        int diff = Math.Clamp(session.FinalDifficulty ?? session.ChosenDifficulty, 1, 6);
        decimal baseMean = BaseMeans[diff];

        decimal Rand(decimal variance = 8m) =>
            Math.Clamp(baseMean + (decimal)(Rng.NextDouble() * (double)(variance * 2) - (double)variance), 0m, 100m);

        var aggregate = new Services.OPICScoreAggregate(
            PronunciationAvg:   Math.Round(Rand(8m), 1),
            FluencyAvg:         Math.Round(Rand(10m), 1),
            CoherenceAvg:       Math.Round(Rand(10m), 1),
            VocabularyAvg:      Math.Round(Rand(8m), 1),
            TaskAchievementAvg: Math.Round(Rand(6m), 1));

        var engineResult = Services.OPICLevelEngine.Calculate(aggregate, diff);
        var advice = Services.OPICLevelEngine.BuildImprovementAdvice(
            engineResult.WeakestSkill, engineResult.AssignedLevel);

        var levelResult = OPICLevelResult.Create(
            userId:            session.UserId,
            sessionId:         session.Id,
            assignedLevel:     engineResult.AssignedLevel,
            overallScore:      engineResult.OverallScore,
            pronunciation:     aggregate.PronunciationAvg,
            fluency:           aggregate.FluencyAvg,
            coherence:         aggregate.CoherenceAvg,
            vocabulary:        aggregate.VocabularyAvg,
            taskAchievement:   aggregate.TaskAchievementAvg,
            justification:     null,   // JSONB field — skip for simulation
            strongestSkill:    engineResult.StrongestSkill,
            weakestSkill:      engineResult.WeakestSkill,
            improvementAdvice: advice,
            language:          session.Language);

        db.OPICLevelResults.Add(levelResult);
        session.Complete(engineResult.AssignedLevel, engineResult.OverallScore);
        await db.SaveChangesAsync(ct);

        return FinalizeSessionHandler.ToDto(levelResult);
    }
}
