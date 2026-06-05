using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.QuizConfig.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record QuizTypeConfigDto(
    Guid   Id,
    string ExamMode,
    string Value,
    string Label,
    int    SortOrder,
    bool   IsActive,
    DateTime CreatedAt);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetQuizTypeConfigsQuery(string? ExamMode = null, bool? ActiveOnly = null)
    : IRequest<List<QuizTypeConfigDto>>;

public class GetQuizTypeConfigsHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizTypeConfigsQuery, List<QuizTypeConfigDto>>
{
    public async Task<List<QuizTypeConfigDto>> Handle(
        GetQuizTypeConfigsQuery req, CancellationToken ct)
    {
        var q = db.QuizTypeConfigs.AsQueryable();

        if (!string.IsNullOrEmpty(req.ExamMode))
            q = q.Where(x => x.ExamMode == req.ExamMode);

        if (req.ActiveOnly == true)
            q = q.Where(x => x.IsActive);

        return await q
            .OrderBy(x => x.ExamMode)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Label)
            .Select(x => new QuizTypeConfigDto(
                x.Id, x.ExamMode, x.Value, x.Label,
                x.SortOrder, x.IsActive, x.CreatedAt))
            .ToListAsync(ct);
    }
}
