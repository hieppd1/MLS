using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Application.Quiz.Services;
using MLS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MLS.Application.Quiz.Queries;

// ── Get test quota for a quiz ─────────────────────────────────────────────────

public record GetTestQuotaQuery(Guid QuizId, Guid UserId) : IRequest<TestQuotaDto>;

public record TestQuotaDto(
    bool IsLimited,
    int Quota,
    int Used,
    int Remaining,
    bool IsMonthly,
    string? ResetDate,       // ISO date string "2026-06-01"
    string? PackageType,
    string? Message);

public class GetTestQuotaHandler(IApplicationDbContext db)
    : IRequestHandler<GetTestQuotaQuery, TestQuotaDto>
{
    public async Task<TestQuotaDto> Handle(GetTestQuotaQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == q.QuizId, ct);

        if (quiz is null || !TestQuotaService.IsTestType(quiz.QuizType))
            return new TestQuotaDto(false, 0, 0, 0, false, null, null, null);

        var status = await TestQuotaService.GetQuotaStatusAsync(db, q.UserId, quiz.CourseId, ct);

        var message = status.PackageType is null
            ? $"Bạn còn {status.Remaining}/{status.Quota} lần thi miễn phí. Mua khoá học để có thêm lượt thi."
            : status.Remaining == int.MaxValue
                ? "Không giới hạn lượt thi (gói cao cấp)."
                : $"Còn {status.Remaining}/{status.Quota} lần thi tháng này. Reset vào {status.ResetDate?.ToString("dd/MM/yyyy")}.";

        return new TestQuotaDto(
            IsLimited: true,
            Quota: status.Quota == int.MaxValue ? 0 : status.Quota,
            Used: status.Used,
            Remaining: status.Remaining == int.MaxValue ? -1 : status.Remaining,
            IsMonthly: status.IsMonthly,
            ResetDate: status.ResetDate?.ToString("yyyy-MM-dd"),
            PackageType: status.PackageType,
            Message: message);
    }
}
