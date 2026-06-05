using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Commands;

// ── Add Question to Quiz ──────────────────────────────────────────────────────

public record AddQuestionToQuizCommand(
    Guid QuizId,
    Guid QuestionId,
    int DisplayOrder,
    decimal Score = 1m
) : IRequest<Guid>;

public class AddQuestionToQuizHandler(IApplicationDbContext db)
    : IRequestHandler<AddQuestionToQuizCommand, Guid>
{
    public async Task<Guid> Handle(AddQuestionToQuizCommand cmd, CancellationToken ct)
    {
        var exists = await db.QuizQuestions
            .AnyAsync(qq => qq.QuizId == cmd.QuizId && qq.QuestionId == cmd.QuestionId, ct);
        if (exists) throw new InvalidOperationException("Question already in quiz.");

        var link = QuizQuestion.Create(cmd.QuizId, cmd.QuestionId, cmd.DisplayOrder, cmd.Score);
        db.QuizQuestions.Add(link);
        await db.SaveChangesAsync(ct);
        return link.Id;
    }
}

// ── Remove Question from Quiz ─────────────────────────────────────────────────

public record RemoveQuestionFromQuizCommand(Guid QuizId, Guid QuestionId) : IRequest<bool>;

public class RemoveQuestionFromQuizHandler(IApplicationDbContext db)
    : IRequestHandler<RemoveQuestionFromQuizCommand, bool>
{
    public async Task<bool> Handle(RemoveQuestionFromQuizCommand cmd, CancellationToken ct)
    {
        var link = await db.QuizQuestions
            .FirstOrDefaultAsync(qq => qq.QuizId == cmd.QuizId && qq.QuestionId == cmd.QuestionId, ct);
        if (link == null) return false;
        db.QuizQuestions.Remove(link);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Reorder Questions ─────────────────────────────────────────────────────────

public record ReorderItem(Guid QuestionId, int DisplayOrder);

public record ReorderQuizQuestionsCommand(Guid QuizId, List<ReorderItem> Items) : IRequest<bool>;

public class ReorderQuizQuestionsHandler(IApplicationDbContext db)
    : IRequestHandler<ReorderQuizQuestionsCommand, bool>
{
    public async Task<bool> Handle(ReorderQuizQuestionsCommand cmd, CancellationToken ct)
    {
        var links = await db.QuizQuestions
            .Where(qq => qq.QuizId == cmd.QuizId)
            .ToListAsync(ct);

        foreach (var item in cmd.Items)
        {
            var link = links.FirstOrDefault(l => l.QuestionId == item.QuestionId);
            link?.Reorder(item.DisplayOrder);
        }
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Override Question Score ───────────────────────────────────────────────────

public record OverrideQuestionScoreCommand(Guid QuizId, Guid QuestionId, decimal Score) : IRequest<bool>;

public class OverrideQuestionScoreHandler(IApplicationDbContext db)
    : IRequestHandler<OverrideQuestionScoreCommand, bool>
{
    public async Task<bool> Handle(OverrideQuestionScoreCommand cmd, CancellationToken ct)
    {
        var link = await db.QuizQuestions
            .FirstOrDefaultAsync(qq => qq.QuizId == cmd.QuizId && qq.QuestionId == cmd.QuestionId, ct);
        if (link == null) return false;
        link.OverrideScore(cmd.Score);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
