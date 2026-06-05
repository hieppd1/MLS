using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Commands;

// ── Submit Writing Essay ──────────────────────────────────────────────────────

public record SubmitWritingCommand(
    Guid   AttemptId,
    Guid   QuestionId,
    Guid   UserId,
    string TenantSlug,
    string EssayText,
    int    WordCount,
    string? TaskType  = null,
    string? EssayType = null,
    string? ExamModeTag = null) : IRequest<SubmitWritingResult>;

public record SubmitWritingResult(Guid SubmissionId, string Status);

public class SubmitWritingHandler(
    IApplicationDbContext db,
    IWritingGradingQueue  queue)
    : IRequestHandler<SubmitWritingCommand, SubmitWritingResult>
{
    private const int MaxWords = 1000;

    public async Task<SubmitWritingResult> Handle(SubmitWritingCommand cmd, CancellationToken ct)
    {
        if (cmd.WordCount > MaxWords)
            throw new InvalidOperationException($"Essay exceeds maximum {MaxWords} word limit.");

        // Validate attempt belongs to user
        var attempt = await db.QuizAttempts
            .FirstOrDefaultAsync(a => a.Id == cmd.AttemptId && a.UserId == cmd.UserId, ct)
            ?? throw new InvalidOperationException("Attempt not found.");

        // Find or create AttemptAnswer for this question
        var answer = await db.AttemptAnswers
            .FirstOrDefaultAsync(a => a.AttemptId == cmd.AttemptId && a.QuestionId == cmd.QuestionId, ct);

        if (answer is null)
        {
            answer = AttemptAnswer.Create(cmd.AttemptId, cmd.QuestionId, isSkipped: false);
            db.AttemptAnswers.Add(answer);
            await db.SaveChangesAsync(ct);
        }

        // Create submission record
        var submission = WritingSubmission.Create(
            answer.Id,
            cmd.UserId,
            cmd.EssayText,
            cmd.WordCount,
            cmd.TaskType,
            cmd.EssayType,
            cmd.ExamModeTag);

        db.WritingSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        // Enqueue for AI grading
        queue.Enqueue(new WritingGradingRequest(
            submission.Id,
            cmd.UserId,
            cmd.EssayText,
            cmd.WordCount,
            cmd.TenantSlug,
            cmd.TaskType,
            cmd.EssayType,
            cmd.ExamModeTag));

        return new SubmitWritingResult(submission.Id, submission.GradingStatus.ToString());
    }
}
