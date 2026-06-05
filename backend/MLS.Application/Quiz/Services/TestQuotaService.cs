using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Services;

/// <summary>
/// Determines which QuizTypes count against the test-attempt quota.
/// Practice/segment/adaptive quizzes are exempt — only formal "tests" are limited.
/// </summary>
public static class TestQuotaService
{
    /// <summary>Free-tier lifetime test limit (no active package).</summary>
    public const int FreeLifetimeTestQuota = 2;
    private static readonly HashSet<QuizType> QuotaTypes =
    [
        QuizType.PlacementTest,
        QuizType.MockTest,
        QuizType.OPICMockTest,
        QuizType.OPICMiniTest,
        QuizType.VSTEPMockTest,
        QuizType.VSTEPListening,
        QuizType.VSTEPReading,
        QuizType.VSTEPWriting,
        QuizType.VSTEPSpeaking,
    ];

    public static bool IsTestType(QuizType quizType) => QuotaTypes.Contains(quizType);

    /// <summary>
    /// Returns the active <see cref="StudentPackage"/> (with package loaded) for a given
    /// student and course, or null if the student has no active package for that course.
    /// </summary>
    public static async Task<StudentPackage?> GetActivePackageAsync(
        IApplicationDbContext db, Guid userId, Guid? courseId, CancellationToken ct)
    {
        if (courseId is null) return null;

        return await db.StudentPackages
            .Include(sp => sp.Package)
            .Where(sp =>
                sp.StudentId == userId
                && sp.Package.CourseId == courseId.Value
                && sp.Status == StudentPackageStatus.Active
                && (sp.ExpiredDate == null || sp.ExpiredDate > DateTime.UtcNow))
            .OrderByDescending(sp => sp.Package.PackageType)   // prefer higher tier
            .FirstOrDefaultAsync(ct);
    }

    /// <summary>
    /// Checks whether a user may start another test attempt.
    /// Throws <see cref="TestQuotaExceededException"/> if the limit is reached.
    /// </summary>
    public static async Task EnforceQuotaAsync(
        IApplicationDbContext db, Guid userId, Guid? courseId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var activePackage = await GetActivePackageAsync(db, userId, courseId, ct);

        if (activePackage is null)
        {
            // Free tier: count all non-abandoned test attempts ever (across all test quizzes)
            var usedLifetime = await CountTestAttemptsAsync(db, userId, since: null, ct);
            if (usedLifetime >= FreeLifetimeTestQuota)
                throw new TestQuotaExceededException(
                    quota: FreeLifetimeTestQuota,
                    used: usedLifetime,
                    isMonthly: false,
                    resetDate: null);
        }
        else
        {
            // Paid tier: count test attempts within the current calendar month
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd   = monthStart.AddMonths(1);
            var quota      = activePackage.Package.ResolvedMonthlyTestQuota;

            if (quota == 0) return;  // unlimited

            var usedThisMonth = await CountTestAttemptsAsync(db, userId, since: monthStart, ct, until: monthEnd);
            if (usedThisMonth >= quota)
                throw new TestQuotaExceededException(
                    quota: quota,
                    used: usedThisMonth,
                    isMonthly: true,
                    resetDate: monthEnd);
        }
    }

    /// <summary>
    /// Returns the current quota status for a user on a quiz.
    /// </summary>
    public static async Task<TestQuotaStatus> GetQuotaStatusAsync(
        IApplicationDbContext db, Guid userId, Guid? courseId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var activePackage = await GetActivePackageAsync(db, userId, courseId, ct);

        if (activePackage is null)
        {
            var usedLifetime = await CountTestAttemptsAsync(db, userId, since: null, ct);
            return new TestQuotaStatus(
                Quota: FreeLifetimeTestQuota,
                Used: usedLifetime,
                Remaining: Math.Max(0, FreeLifetimeTestQuota - usedLifetime),
                IsMonthly: false,
                ResetDate: null,
                PackageType: null);
        }
        else
        {
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd   = monthStart.AddMonths(1);
            var quota      = activePackage.Package.ResolvedMonthlyTestQuota;
            var used       = quota == 0 ? 0
                           : await CountTestAttemptsAsync(db, userId, since: monthStart, ct, until: monthEnd);

            return new TestQuotaStatus(
                Quota: quota == 0 ? int.MaxValue : quota,
                Used: used,
                Remaining: quota == 0 ? int.MaxValue : Math.Max(0, quota - used),
                IsMonthly: true,
                ResetDate: monthEnd,
                PackageType: activePackage.Package.PackageType.ToString());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    private static async Task<int> CountTestAttemptsAsync(
        IApplicationDbContext db, Guid userId,
        DateTime? since, CancellationToken ct, DateTime? until = null)
    {
        var query = db.QuizAttempts
            .Where(a =>
                a.UserId == userId
                && a.State != AttemptState.Abandoned
                && QuotaTypes.Contains(a.Quiz!.QuizType));

        if (since.HasValue)  query = query.Where(a => a.StartedAt >= since.Value);
        if (until.HasValue)  query = query.Where(a => a.StartedAt < until.Value);

        return await query.CountAsync(ct);
    }
}

// ── Result types ──────────────────────────────────────────────────────────────

public record TestQuotaStatus(
    int Quota,
    int Used,
    int Remaining,
    bool IsMonthly,
    DateTime? ResetDate,
    string? PackageType);

public class TestQuotaExceededException(int quota, int used, bool isMonthly, DateTime? resetDate)
    : Exception(BuildMessage(quota, used, isMonthly, resetDate))
{
    public int Quota { get; } = quota;
    public int Used  { get; } = used;
    public bool IsMonthly { get; } = isMonthly;
    public DateTime? ResetDate { get; } = resetDate;

    private static string BuildMessage(int quota, int used, bool isMonthly, DateTime? resetDate)
    {
        if (!isMonthly)
            return $"Bạn đã dùng hết {quota} lần thi miễn phí. Mua khoá học để có thêm lượt thi hàng tháng.";

        var resetStr = resetDate.HasValue
            ? resetDate.Value.ToString("dd/MM/yyyy")
            : "tháng sau";
        return $"Bạn đã dùng {used}/{quota} lần thi trong tháng này. Lượt thi sẽ reset vào {resetStr}.";
    }
}
