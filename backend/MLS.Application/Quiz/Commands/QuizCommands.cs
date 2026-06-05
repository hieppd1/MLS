using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Commands;

// ── Create Quiz ───────────────────────────────────────────────────────────────

public record CreateQuizCommand(
    string Title,
    Guid CreatedBy,
    string QuizType     = "PracticeQuiz",
    string SkillType    = "Mixed",
    string ExamMode     = "Standard",
    int Level           = 1,
    int? Duration       = null,
    decimal TotalScore  = 10m,
    decimal PassingScore= 7m,
    bool AllowRetry     = true,
    int? RetryLimit     = null,
    bool RandomQuestion = false,
    bool RandomAnswer   = false,
    bool ShowCorrectAnswer = true,
    bool ShowExplanation   = true,
    string? Description    = null,
    Guid? CourseId         = null,
    Guid? SessionId        = null,
    int? VideoTriggerSecond= null
) : IRequest<Guid>;

public class CreateQuizHandler(IApplicationDbContext db)
    : IRequestHandler<CreateQuizCommand, Guid>
{
    public async Task<Guid> Handle(CreateQuizCommand cmd, CancellationToken ct)
    {
        var quizType  = Enum.TryParse<QuizType>(cmd.QuizType, out var qt)   ? qt : QuizType.PracticeQuiz;
        var skillType = Enum.TryParse<SkillType>(cmd.SkillType, out var st) ? st : SkillType.Mixed;
        var examMode  = Enum.TryParse<ExamMode>(cmd.ExamMode, out var em)   ? em : ExamMode.Standard;
        var quiz = Domain.Entities.Quiz.Create(
            cmd.Title, cmd.CreatedBy, quizType, skillType, cmd.Level,
            cmd.Duration, cmd.TotalScore, cmd.PassingScore,
            cmd.AllowRetry, cmd.RetryLimit, cmd.RandomQuestion, cmd.RandomAnswer,
            cmd.ShowCorrectAnswer, cmd.ShowExplanation,
            cmd.Description, cmd.CourseId, cmd.SessionId, cmd.VideoTriggerSecond,
            examMode);
        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync(ct);
        return quiz.Id;
    }
}

// ── Update Quiz ───────────────────────────────────────────────────────────────

public record UpdateQuizCommand(
    Guid QuizId,
    string Title,
    string? Description,
    int Level,
    int? Duration,
    decimal TotalScore,
    decimal PassingScore,
    bool AllowRetry,
    int? RetryLimit,
    bool RandomQuestion,
    bool RandomAnswer,
    bool ShowCorrectAnswer,
    bool ShowExplanation,
    Guid? CourseId,
    Guid? SessionId,
    int? VideoTriggerSecond
) : IRequest<bool>;

public class UpdateQuizHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateQuizCommand, bool>
{
    public async Task<bool> Handle(UpdateQuizCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FindAsync([cmd.QuizId], ct);
        if (quiz == null) return false;
        quiz.Update(cmd.Title, cmd.Description, cmd.Level, cmd.Duration,
            cmd.TotalScore, cmd.PassingScore, cmd.AllowRetry, cmd.RetryLimit,
            cmd.RandomQuestion, cmd.RandomAnswer, cmd.ShowCorrectAnswer, cmd.ShowExplanation,
            cmd.CourseId, cmd.SessionId, cmd.VideoTriggerSecond);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Delete Quiz ───────────────────────────────────────────────────────────────

public record DeleteQuizCommand(Guid QuizId) : IRequest<bool>;

public class DeleteQuizHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteQuizCommand, bool>
{
    public async Task<bool> Handle(DeleteQuizCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FindAsync([cmd.QuizId], ct);
        if (quiz == null || quiz.Status != QuizStatus.Draft) return false;
        db.Quizzes.Remove(quiz);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Publish Quiz ──────────────────────────────────────────────────────────────

public record PublishQuizCommand(Guid QuizId) : IRequest<bool>;

public class PublishQuizHandler(IApplicationDbContext db)
    : IRequestHandler<PublishQuizCommand, bool>
{
    public async Task<bool> Handle(PublishQuizCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FindAsync([cmd.QuizId], ct);
        if (quiz == null) return false;
        quiz.Publish();
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Archive Quiz ──────────────────────────────────────────────────────────────

public record ArchiveQuizCommand(Guid QuizId) : IRequest<bool>;

public class ArchiveQuizHandler(IApplicationDbContext db)
    : IRequestHandler<ArchiveQuizCommand, bool>
{
    public async Task<bool> Handle(ArchiveQuizCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FindAsync([cmd.QuizId], ct);
        if (quiz == null) return false;
        quiz.Archive();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
