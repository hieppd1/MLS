using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.CMS.Sessions.Queries;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.Learning.Commands;

// ── Start Session (create or return existing progress) ────────────────────────

public record StartSessionCommand(Guid UserId, Guid SessionId) : IRequest<SessionProgressDto>;

public record SessionProgressDto(
    Guid SessionId,
    string Status,
    int LastPositionSeconds,
    double WatchPercentage
);

public class StartSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<StartSessionCommand, SessionProgressDto>
{
    public async Task<SessionProgressDto> Handle(StartSessionCommand request, CancellationToken ct)
    {
        var existing = await db.SessionProgresses
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.SessionId == request.SessionId, ct);

        if (existing != null)
            return new SessionProgressDto(existing.SessionId, existing.Status.ToString(),
                existing.LastPositionSeconds, existing.WatchPercentage);

        var progress = SessionProgress.Create(request.UserId, request.SessionId);
        db.SessionProgresses.Add(progress);
        await db.SaveChangesAsync(ct);

        return new SessionProgressDto(progress.SessionId, progress.Status.ToString(),
            progress.LastPositionSeconds, progress.WatchPercentage);
    }
}

// ── Update Video Position ─────────────────────────────────────────────────────

public record UpdateSessionVideoPositionCommand(
    Guid UserId,
    Guid SessionId,
    int LastPositionSeconds,
    int WatchedSeconds,
    double WatchPercentage
) : IRequest;

public class UpdateSessionVideoPositionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateSessionVideoPositionCommand>
{
    public async Task Handle(UpdateSessionVideoPositionCommand request, CancellationToken ct)
    {
        var progress = await db.SessionProgresses
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.SessionId == request.SessionId, ct);

        if (progress == null)
        {
            progress = SessionProgress.Create(request.UserId, request.SessionId);
            db.SessionProgresses.Add(progress);
        }

        progress.UpdatePosition(request.LastPositionSeconds, request.WatchedSeconds, request.WatchPercentage);
        await db.SaveChangesAsync(ct);
    }
}

// ── Complete Session ──────────────────────────────────────────────────────────

public record CompleteSessionCommand(Guid UserId, Guid SessionId) : IRequest;

public class CompleteSessionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CompleteSessionCommand>
{
    // Business rule (spec 6.2): session is considered completed when >= 80% watched.
    public const double MinWatchPercentage = 80.0;

    public async Task Handle(CompleteSessionCommand request, CancellationToken ct)
    {
        var progress = await db.SessionProgresses
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.SessionId == request.SessionId, ct);

        if (progress == null)
            throw new NotFoundException(nameof(SessionProgress),
                $"user:{request.UserId}/session:{request.SessionId}");

        if (progress.WatchPercentage < MinWatchPercentage)
            throw new DomainException(
                $"Cannot complete session: only {progress.WatchPercentage:F1}% watched. " +
                $"Minimum required: {MinWatchPercentage}%.");

        progress.Complete();
        await db.SaveChangesAsync(ct);
    }
}

// ── Mark Segment Viewed ───────────────────────────────────────────────────────

public record MarkSegmentViewedCommand(Guid UserId, Guid SegmentId) : IRequest;

public class MarkSegmentViewedCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MarkSegmentViewedCommand>
{
    public async Task Handle(MarkSegmentViewedCommand request, CancellationToken ct)
    {
        var progress = await db.SegmentProgresses
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.SegmentId == request.SegmentId, ct);

        if (progress == null)
        {
            progress = SegmentProgress.Create(request.UserId, request.SegmentId);
            db.SegmentProgresses.Add(progress);
        }

        progress.MarkViewed();
        await db.SaveChangesAsync(ct);
    }
}

// ── Complete Segment ──────────────────────────────────────────────────────────

public record CompleteSegmentCommand(Guid UserId, Guid SegmentId) : IRequest;

public class CompleteSegmentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CompleteSegmentCommand>
{
    public async Task Handle(CompleteSegmentCommand request, CancellationToken ct)
    {
        var progress = await db.SegmentProgresses
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.SegmentId == request.SegmentId, ct);

        if (progress == null)
        {
            progress = SegmentProgress.Create(request.UserId, request.SegmentId);
            db.SegmentProgresses.Add(progress);
        }

        progress.MarkCompleted();
        await db.SaveChangesAsync(ct);
    }
}

// ── Record Asset Interaction ──────────────────────────────────────────────────

public record RecordAssetInteractionCommand(
    Guid UserId,
    Guid AssetId,
    string InteractionType,
    int? Score = null
) : IRequest;

public class RecordAssetInteractionCommandHandler(IApplicationDbContext db)
    : IRequestHandler<RecordAssetInteractionCommand>
{
    public async Task Handle(RecordAssetInteractionCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<AssetInteractionType>(request.InteractionType, ignoreCase: true, out var interactionType))
            throw new DomainException($"Unknown interaction type: '{request.InteractionType}'. " +
                $"Valid values: {string.Join(", ", Enum.GetNames<AssetInteractionType>())}");

        var interaction = LearningAssetInteraction.Create(
            request.UserId, request.AssetId, interactionType, request.Score);

        db.LearningAssetInteractions.Add(interaction);
        await db.SaveChangesAsync(ct);
    }
}

// ── Submit Quiz ────────────────────────────────────────────────────────────────

public record QuizAnswerFeedback(int QuestionIndex, bool Correct, int CorrectAnswer, string? Explanation);
public record QuizSubmitResultDto(bool Passed, int Score, int PassScore, IList<QuizAnswerFeedback> Feedback);
public record SubmitQuizCommand(Guid UserId, Guid AssetId, List<int> Answers) : IRequest<QuizSubmitResultDto>;

public class SubmitQuizCommandHandler(IApplicationDbContext db)
    : IRequestHandler<SubmitQuizCommand, QuizSubmitResultDto>
{
    public async Task<QuizSubmitResultDto> Handle(SubmitQuizCommand request, CancellationToken ct)
    {
        var asset = await db.LearningAssets.FindAsync([request.AssetId], ct)
            ?? throw new NotFoundException(nameof(LearningAsset), request.AssetId);

        if (asset.Type != LearningAssetType.QuizBlock)
            throw new DomainException("Asset is not a QuizBlock.");

        using var doc = System.Text.Json.JsonDocument.Parse(asset.Metadata ?? "{}");
        var root = doc.RootElement;

        var passScore = root.TryGetProperty("passScore", out var ps) && ps.TryGetInt32(out var psVal) ? psVal : 70;

        // Parse questions + correct answers from metadata
        var questions = new List<(int Correct, string? Explanation)>();
        if (root.TryGetProperty("questions", out var qArr) && qArr.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var q in qArr.EnumerateArray())
            {
                var correct = q.TryGetProperty("correct", out var c) && c.TryGetInt32(out var cv) ? cv : 0;
                var explanation = q.TryGetProperty("explanation", out var ex) ? ex.GetString() : null;
                questions.Add((correct, explanation));
            }
        }

        var feedback = new List<QuizAnswerFeedback>();
        int correctCount = 0;
        for (int i = 0; i < questions.Count; i++)
        {
            var submitted = i < request.Answers.Count ? request.Answers[i] : -1;
            var isCorrect = submitted == questions[i].Correct;
            if (isCorrect) correctCount++;
            feedback.Add(new QuizAnswerFeedback(i, isCorrect, questions[i].Correct, questions[i].Explanation));
        }

        int score = questions.Count > 0 ? (int)Math.Round((double)correctCount / questions.Count * 100) : 0;
        bool passed = score >= passScore;

        // Record the interaction
        var interactionType = passed ? AssetInteractionType.QuizPassed : AssetInteractionType.QuizFailed;
        var interaction = LearningAssetInteraction.Create(request.UserId, request.AssetId, interactionType, score);
        db.LearningAssetInteractions.Add(interaction);
        await db.SaveChangesAsync(ct);

        return new QuizSubmitResultDto(passed, score, passScore, feedback);
    }
}
