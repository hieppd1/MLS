using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Commands;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record QuestionOptionInput(
    string Content,
    bool IsCorrect,
    int DisplayOrder,
    string? MatchKey           = null,
    string? MatchValue         = null,
    string? FeedbackIfSelected = null);

// ── Create Question ───────────────────────────────────────────────────────────

public record CreateQuestionCommand(
    string Content,
    Guid CreatedBy,
    string Type            = "SingleChoice",
    string SkillType       = "Mixed",
    string Difficulty      = "Medium",
    decimal DefaultScore   = 1m,
    string? Explanation    = null,
    string? AudioUrl       = null,
    string? ImageUrl       = null,
    string? VideoUrl       = null,
    string? Tags           = null,
    bool IsPublic          = false,
    List<QuestionOptionInput>? Options = null
) : IRequest<Guid>;

public class CreateQuestionHandler(IApplicationDbContext db)
    : IRequestHandler<CreateQuestionCommand, Guid>
{
    public async Task<Guid> Handle(CreateQuestionCommand cmd, CancellationToken ct)
    {
        var type       = Enum.TryParse<QuestionType>(cmd.Type, out var qt)         ? qt : QuestionType.SingleChoice;
        var skillType  = Enum.TryParse<SkillType>(cmd.SkillType, out var st)       ? st : SkillType.Mixed;
        var difficulty = Enum.TryParse<DifficultyLevel>(cmd.Difficulty, out var dl) ? dl : DifficultyLevel.Medium;

        var question = Domain.Entities.Question.Create(
            cmd.Content, cmd.CreatedBy, type, skillType, difficulty,
            cmd.DefaultScore, cmd.Explanation, cmd.AudioUrl,
            cmd.ImageUrl, cmd.VideoUrl, cmd.Tags, cmd.IsPublic);

        if (cmd.Options != null)
        {
            foreach (var o in cmd.Options)
                question.Options.Add(QuestionOption.Create(
                    question.Id, o.Content, o.IsCorrect, o.DisplayOrder,
                    o.MatchKey, o.MatchValue, o.FeedbackIfSelected));
        }

        db.Questions.Add(question);
        await db.SaveChangesAsync(ct);
        return question.Id;
    }
}

// ── Update Question ───────────────────────────────────────────────────────────

public record UpdateQuestionCommand(
    Guid QuestionId,
    string Content,
    string Type,
    string SkillType,
    string Difficulty,
    decimal DefaultScore,
    string? Explanation,
    string? AudioUrl,
    string? ImageUrl,
    string? VideoUrl,
    string? Tags,
    bool IsPublic,
    List<QuestionOptionInput> Options,
    int? AudioPlayLimit        = null,
    int? SpeakingTimeLimitSec  = null,
    string? ExamModeTag        = null
) : IRequest<bool>;

public class UpdateQuestionHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateQuestionCommand, bool>
{
    public async Task<bool> Handle(UpdateQuestionCommand cmd, CancellationToken ct)
    {
        var question = await db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == cmd.QuestionId, ct);
        if (question == null) return false;

        var type       = Enum.TryParse<QuestionType>(cmd.Type, out var qt)         ? qt : QuestionType.SingleChoice;
        var skillType  = Enum.TryParse<SkillType>(cmd.SkillType, out var st)       ? st : SkillType.Mixed;
        var difficulty = Enum.TryParse<DifficultyLevel>(cmd.Difficulty, out var dl) ? dl : DifficultyLevel.Medium;

        question.Update(cmd.Content, type, skillType, difficulty,
            cmd.DefaultScore, cmd.Explanation, cmd.AudioUrl,
            cmd.ImageUrl, cmd.VideoUrl, cmd.Tags, cmd.IsPublic,
            cmd.AudioPlayLimit, cmd.SpeakingTimeLimitSec, cmd.ExamModeTag);

        // Replace options
        db.QuestionOptions.RemoveRange(question.Options);
        foreach (var o in cmd.Options)
            db.QuestionOptions.Add(QuestionOption.Create(
                question.Id, o.Content, o.IsCorrect, o.DisplayOrder,
                o.MatchKey, o.MatchValue, o.FeedbackIfSelected));

        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Delete Question ───────────────────────────────────────────────────────────

public record DeleteQuestionCommand(Guid QuestionId) : IRequest<bool>;

public class DeleteQuestionHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteQuestionCommand, bool>
{
    public async Task<bool> Handle(DeleteQuestionCommand cmd, CancellationToken ct)
    {
        // Y13: Soft delete — preserve historical AttemptAnswer data
        var question = await db.Questions
            .IgnoreQueryFilters()  // find even if already deleted
            .FirstOrDefaultAsync(q => q.Id == cmd.QuestionId, ct);
        if (question == null) return false;
        question.SoftDelete();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
