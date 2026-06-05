using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record QuestionListItemDto(
    Guid Id, string Content, string Type, string SkillType, string Difficulty,
    decimal DefaultScore, bool IsPublic, string? Tags, DateTime CreatedAt, int OptionCount);

public record QuestionDetailDto(
    Guid Id, string Content, string Type, string SkillType, string Difficulty,
    decimal DefaultScore, bool IsPublic, string? Tags, string? Explanation,
    string? AudioUrl, string? ImageUrl, string? VideoUrl,
    DateTime CreatedAt, List<OptionDetailDto> Options);

public record OptionDetailDto(
    Guid Id, string Content, bool IsCorrect, int DisplayOrder,
    string? MatchKey, string? MatchValue, string? FeedbackIfSelected);

// ── Get Question List ─────────────────────────────────────────────────────────

public record GetQuestionListQuery(
    int Page = 1, int PageSize = 30,
    string? Type       = null,
    string? Skill      = null,
    string? Difficulty = null,
    string? Tag        = null,
    string? Search     = null,
    Guid? CreatedBy    = null,
    bool? IsPublic     = null
) : IRequest<PagedResult<QuestionListItemDto>>;

public class GetQuestionListHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuestionListQuery, PagedResult<QuestionListItemDto>>
{
    public async Task<PagedResult<QuestionListItemDto>> Handle(GetQuestionListQuery q, CancellationToken ct)
    {
        var query = db.Questions.AsNoTracking();

        if (q.Type       != null && Enum.TryParse<QuestionType>(q.Type, out var qt))    query = query.Where(x => x.Type == qt);
        if (q.Skill      != null && Enum.TryParse<SkillType>(q.Skill, out var st))      query = query.Where(x => x.SkillType == st);
        if (q.Difficulty != null && Enum.TryParse<DifficultyLevel>(q.Difficulty, out var dl)) query = query.Where(x => x.Difficulty == dl);
        if (q.Tag        != null)  query = query.Where(x => x.Tags != null && x.Tags.Contains(q.Tag));
        if (q.Search     != null)  query = query.Where(x => x.Content.Contains(q.Search));
        if (q.CreatedBy  != null)  query = query.Where(x => x.CreatedBy == q.CreatedBy);
        if (q.IsPublic   != null)  query = query.Where(x => x.IsPublic == q.IsPublic);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(x => new QuestionListItemDto(
                x.Id, x.Content, x.Type.ToString(), x.SkillType.ToString(), x.Difficulty.ToString(),
                x.DefaultScore, x.IsPublic, x.Tags, x.CreatedAt,
                x.Options.Count))
            .ToListAsync(ct);

        return new PagedResult<QuestionListItemDto>(items, total, q.Page, q.PageSize);
    }
}

// ── Get Question Detail ───────────────────────────────────────────────────────

public record GetQuestionDetailQuery(Guid QuestionId) : IRequest<QuestionDetailDto?>;

public class GetQuestionDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuestionDetailQuery, QuestionDetailDto?>
{
    public async Task<QuestionDetailDto?> Handle(GetQuestionDetailQuery q, CancellationToken ct)
    {
        var question = await db.Questions
            .AsNoTracking()
            .Include(x => x.Options.OrderBy(o => o.DisplayOrder))
            .FirstOrDefaultAsync(x => x.Id == q.QuestionId, ct);

        if (question == null) return null;

        return new QuestionDetailDto(
            question.Id, question.Content, question.Type.ToString(),
            question.SkillType.ToString(), question.Difficulty.ToString(),
            question.DefaultScore, question.IsPublic, question.Tags,
            question.Explanation, question.AudioUrl, question.ImageUrl, question.VideoUrl,
            question.CreatedAt,
            question.Options.Select(o => new OptionDetailDto(
                o.Id, o.Content, o.IsCorrect, o.DisplayOrder,
                o.MatchKey, o.MatchValue, o.FeedbackIfSelected)).ToList());
    }
}
