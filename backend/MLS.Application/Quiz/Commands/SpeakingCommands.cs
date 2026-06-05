using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Quiz.Commands;

// ── Upload Speaking Audio ────────────────────────────────────────────────────

public record UploadSpeakingCommand(
    Guid AttemptId,
    Guid QuestionId,
    Guid UserId,
    string TenantSlug,
    Stream AudioStream,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string? ExamModeTag = null) : IRequest<UploadSpeakingResult>;

public record UploadSpeakingResult(Guid SubmissionId, string Status);

public class UploadSpeakingHandler(
    IApplicationDbContext db,
    IStorageService storage,
    ISpeakingGradingQueue queue)
    : IRequestHandler<UploadSpeakingCommand, UploadSpeakingResult>
{
    private const long MaxFileSizeBytes = 52_428_800; // 50 MB

    public async Task<UploadSpeakingResult> Handle(UploadSpeakingCommand cmd, CancellationToken ct)
    {
        if (cmd.FileSizeBytes > MaxFileSizeBytes)
            throw new InvalidOperationException("Audio file exceeds 50 MB limit.");

        // Validate the attempt belongs to this user
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

        // Upload to storage
        var ext = Path.GetExtension(cmd.FileName).ToLowerInvariant() switch
        {
            ".webm" => ".webm",
            ".mp3"  => ".mp3",
            ".wav"  => ".wav",
            ".ogg"  => ".ogg",
            ".m4a"  => ".m4a",
            _       => ".webm"
        };
        var storedFileName = $"{cmd.UserId}_{answer.Id}{ext}";
        var audioUrl = await storage.UploadAsync(
            cmd.TenantSlug,
            "speaking",
            storedFileName,
            cmd.AudioStream,
            cmd.ContentType,
            ct);

        // Create submission record
        var submission = SpeakingSubmission.Create(
            answer.Id,
            cmd.UserId,
            audioUrl,
            cmd.ExamModeTag);

        db.SpeakingSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        // Enqueue for AI grading
        queue.Enqueue(new SpeakingGradingRequest(
            submission.Id,
            cmd.UserId,
            audioUrl,
            cmd.TenantSlug,
            cmd.ExamModeTag));

        return new UploadSpeakingResult(submission.Id, submission.GradingStatus.ToString());
    }
}
