using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Analytics;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record DailyRevenueDto(DateTime Date, decimal Revenue, int OrderCount);

public record TopBookDto(
    Guid    Id,
    string  Title,
    string  CoverEmoji,
    string  CoverColor,
    string? CoverUrl,
    int     PurchaseCount,
    decimal TotalRevenue
);

public record OrderStatsDto(
    int TotalOrders,
    int Pending,
    int WaitingPayment,
    int Paid,
    int Processing,
    int Completed,
    int Cancelled,
    int Failed
);

public record AnalyticsSummaryDto(
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    decimal RevenueLastMonth,
    int     TotalOrders,
    int     CompletedOrders,
    int     TotalBooks,
    int     TotalReviews
);

public record AdminAnalyticsResult(
    AnalyticsSummaryDto     Summary,
    OrderStatsDto           OrderStats,
    List<DailyRevenueDto>   DailyRevenue,
    List<TopBookDto>        TopBooks
);

// ── Query ─────────────────────────────────────────────────────────────────────

public record GetAdminAnalyticsQuery(int Days = 30) : IRequest<AdminAnalyticsResult>;

// ── Handler ───────────────────────────────────────────────────────────────────

public class GetAdminAnalyticsHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminAnalyticsQuery, AdminAnalyticsResult>
{
    public async Task<AdminAnalyticsResult> Handle(GetAdminAnalyticsQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var startOfMonth      = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth  = startOfMonth.AddMonths(-1);
        var endOfLastMonth    = startOfMonth.AddTicks(-1);
        var cutoff            = now.AddDays(-request.Days);

        // Summary
        var allOrders = await db.Orders
            .Where(o => o.Status != OrderStatus.Cancelled && o.Status != OrderStatus.Failed)
            .Select(o => new { o.FinalAmount, o.PaidAt, o.Status, o.CreatedAt })
            .ToListAsync(ct);

        var totalRevenue       = allOrders.Where(o => o.Status == OrderStatus.Completed || o.Status == OrderStatus.Paid)
                                          .Sum(o => o.FinalAmount);
        var revenueThisMonth   = allOrders.Where(o => o.PaidAt >= startOfMonth)
                                          .Sum(o => o.FinalAmount);
        var revenueLastMonth   = allOrders.Where(o => o.PaidAt >= startOfLastMonth && o.PaidAt <= endOfLastMonth)
                                          .Sum(o => o.FinalAmount);

        var totalBooks   = await db.Books.CountAsync(ct);
        var totalReviews = await db.BookReviews.CountAsync(ct);

        var summary = new AnalyticsSummaryDto(
            TotalRevenue:       totalRevenue,
            RevenueThisMonth:   revenueThisMonth,
            RevenueLastMonth:   revenueLastMonth,
            TotalOrders:        allOrders.Count,
            CompletedOrders:    allOrders.Count(o => o.Status == OrderStatus.Completed),
            TotalBooks:         totalBooks,
            TotalReviews:       totalReviews
        );

        // Order stats
        var allStatusOrders = await db.Orders
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        int cnt(OrderStatus s) => allStatusOrders.FirstOrDefault(x => x.Status == s)?.Count ?? 0;
        var orderStats = new OrderStatsDto(
            TotalOrders:    allStatusOrders.Sum(x => x.Count),
            Pending:        cnt(OrderStatus.Pending),
            WaitingPayment: cnt(OrderStatus.WaitingPayment),
            Paid:           cnt(OrderStatus.Paid),
            Processing:     cnt(OrderStatus.Processing),
            Completed:      cnt(OrderStatus.Completed),
            Cancelled:      cnt(OrderStatus.Cancelled),
            Failed:         cnt(OrderStatus.Failed)
        );

        // Daily revenue (last N days)
        var dailyRaw = await db.Orders
            .Where(o => o.PaidAt >= cutoff
                     && (o.Status == OrderStatus.Paid
                      || o.Status == OrderStatus.Completed))
            .Select(o => new { Date = o.PaidAt!.Value.Date, o.FinalAmount })
            .ToListAsync(ct);

        var dailyRevenue = Enumerable.Range(0, request.Days)
            .Select(i => now.Date.AddDays(-i))
            .OrderBy(d => d)
            .Select(d =>
            {
                var dayOrders = dailyRaw.Where(x => x.Date == d).ToList();
                return new DailyRevenueDto(d, dayOrders.Sum(x => x.FinalAmount), dayOrders.Count);
            })
            .ToList();

        // Top books
        var topBooks = await db.Books
            .Where(b => b.PurchaseCount > 0)
            .OrderByDescending(b => b.PurchaseCount)
            .Take(10)
            .Select(b => new TopBookDto(
                b.Id, b.Title, b.CoverEmoji, b.CoverColor, b.CoverUrl,
                b.PurchaseCount,
                db.OrderItems
                    .Where(i => i.BookId == b.Id)
                    .Join(db.Orders, i => i.OrderId, o => o.Id, (i, o) => new { i, o })
                    .Where(x => x.o.Status == OrderStatus.Completed || x.o.Status == OrderStatus.Paid)
                    .Sum(x => x.i.TotalPrice)
            ))
            .ToListAsync(ct);

        return new AdminAnalyticsResult(summary, orderStats, dailyRevenue, topBooks);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 7: Enhanced Dashboard Analytics
// ═══════════════════════════════════════════════════════════════════════════════

// ── User Stats ────────────────────────────────────────────────────────────────

public record UserActivityBucketDto(int Under36h, int From36To72h, int Over72h, int NeverActive);
public record AgeGroupDto(string Group, int Count);
public record CountryStatDto(string Country, int Count);
public record LanguageStatDto(string Language, int Count);
public record WeeklyRegistrationDto(string WeekLabel, int Count);

public record UserStatsResult(
    int TotalUsers,
    int NewThisWeek,
    int NewThisMonth,
    UserActivityBucketDto ActivityBuckets,
    List<AgeGroupDto> AgeGroups,
    List<CountryStatDto> TopCountries,
    List<LanguageStatDto> TopLanguages,
    List<WeeklyRegistrationDto> WeeklyRegistrations
);

public record GetUserStatsQuery(int WeeksBack = 12) : IRequest<UserStatsResult>;

public class GetUserStatsHandler(IApplicationDbContext db)
    : IRequestHandler<GetUserStatsQuery, UserStatsResult>
{
    public async Task<UserStatsResult> Handle(GetUserStatsQuery req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var weekStart  = now.Date.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var users = await db.Users
            .Select(u => new
            {
                u.Id,
                u.CreatedAt,
                u.LastActiveAt,
                Profile = db.UserProfiles
                    .Where(p => p.UserId == u.Id)
                    .Select(p => new { p.DateOfBirth, p.Country, p.NativeLanguage })
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        var total        = users.Count;
        var newThisWeek  = users.Count(u => u.CreatedAt >= weekStart);
        var newThisMonth = users.Count(u => u.CreatedAt >= monthStart);

        // Activity buckets
        int under36 = 0, to72 = 0, over72 = 0, never = 0;
        foreach (var u in users)
        {
            if (u.LastActiveAt == null) { never++; continue; }
            var hours = (now - u.LastActiveAt.Value).TotalHours;
            if (hours < 36)       under36++;
            else if (hours <= 72) to72++;
            else                  over72++;
        }
        var buckets = new UserActivityBucketDto(under36, to72, over72, never);

        // Age groups
        var ageGroups = users
            .Where(u => u.Profile?.DateOfBirth != null)
            .Select(u => (now.Year - u.Profile!.DateOfBirth!.Value.Year))
            .GroupBy(age => age switch
            {
                < 18 => "< 18",
                <= 24 => "18-24",
                <= 34 => "25-34",
                <= 44 => "35-44",
                <= 54 => "45-54",
                _     => "55+",
            })
            .Select(g => new AgeGroupDto(g.Key, g.Count()))
            .OrderBy(g => g.Group)
            .ToList();

        // Countries
        var topCountries = users
            .Where(u => !string.IsNullOrEmpty(u.Profile?.Country))
            .GroupBy(u => u.Profile!.Country!)
            .Select(g => new CountryStatDto(g.Key, g.Count()))
            .OrderByDescending(c => c.Count)
            .Take(10)
            .ToList();

        // Languages
        var topLanguages = users
            .Where(u => !string.IsNullOrEmpty(u.Profile?.NativeLanguage))
            .GroupBy(u => u.Profile!.NativeLanguage!)
            .Select(g => new LanguageStatDto(g.Key, g.Count()))
            .OrderByDescending(l => l.Count)
            .Take(10)
            .ToList();

        // Weekly registrations
        var weeklyRegs = Enumerable.Range(0, req.WeeksBack)
            .Select(i =>
            {
                var ws = weekStart.AddDays(-7 * i);
                var we = ws.AddDays(7);
                var label = ws.ToString("dd/MM");
                var count = users.Count(u => u.CreatedAt >= ws && u.CreatedAt < we);
                return new WeeklyRegistrationDto(label, count);
            })
            .OrderBy(w => w.WeekLabel)
            .ToList();

        return new UserStatsResult(total, newThisWeek, newThisMonth,
            buckets, ageGroups, topCountries, topLanguages, weeklyRegs);
    }
}

// ── Content View Stats ────────────────────────────────────────────────────────

public record ContentViewPeriodDto(string Period, int Views);
public record TopContentDto(Guid Id, string Title, int ViewCount);

public record ContentTypeViewStats(
    int TotalViews,
    int ViewsThisWeek,
    int ViewsThisMonth,
    List<ContentViewPeriodDto> WeeklyViews,
    List<TopContentDto> TopItems
);

public record ContentViewStatsResult(
    ContentTypeViewStats Courses,
    ContentTypeViewStats Teachers,
    ContentTypeViewStats Books
);

public record GetContentViewStatsQuery(int WeeksBack = 8) : IRequest<ContentViewStatsResult>;

public class GetContentViewStatsHandler(IApplicationDbContext db)
    : IRequestHandler<GetContentViewStatsQuery, ContentViewStatsResult>
{
    public async Task<ContentViewStatsResult> Handle(GetContentViewStatsQuery req, CancellationToken ct)
    {
        var now        = DateTime.UtcNow;
        var weekStart  = now.Date.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var cutoff     = weekStart.AddDays(-7 * req.WeeksBack);

        var views = await db.ContentViews
            .Where(v => v.ViewedAt >= cutoff)
            .Select(v => new { v.ContentType, v.ContentId, v.ViewedAt })
            .ToListAsync(ct);

        ContentTypeViewStats BuildStats(ContentViewType type)
        {
            var filtered = views.Where(v => v.ContentType == type).ToList();
            var total    = filtered.Count;
            var thisWeek = filtered.Count(v => v.ViewedAt >= weekStart);
            var thisMonth = filtered.Count(v => v.ViewedAt >= monthStart);

            var weekly = Enumerable.Range(0, req.WeeksBack)
                .Select(i =>
                {
                    var ws = weekStart.AddDays(-7 * i);
                    var we = ws.AddDays(7);
                    return new ContentViewPeriodDto(
                        ws.ToString("dd/MM"),
                        filtered.Count(v => v.ViewedAt >= ws && v.ViewedAt < we));
                })
                .OrderBy(w => w.Period)
                .ToList();

            var topIds = filtered
                .GroupBy(v => v.ContentId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(10)
                .ToList();

            // Resolve titles
            var topItems = topIds.Select(x =>
            {
                string title = type switch
                {
                    ContentViewType.Course  => db.Courses.Where(c => c.Id == x.Id).Select(c => c.Title).FirstOrDefault() ?? "Unknown",
                    ContentViewType.Teacher => db.TeacherProfiles.Where(t => t.UserId == x.Id).Select(t => t.DisplayName).FirstOrDefault() ?? "Unknown",
                    ContentViewType.Book    => db.Books.Where(b => b.Id == x.Id).Select(b => b.Title).FirstOrDefault() ?? "Unknown",
                    _ => "Unknown",
                };
                return new TopContentDto(x.Id, title, x.Count);
            }).ToList();

            return new ContentTypeViewStats(total, thisWeek, thisMonth, weekly, topItems);
        }

        return new ContentViewStatsResult(
            BuildStats(ContentViewType.Course),
            BuildStats(ContentViewType.Teacher),
            BuildStats(ContentViewType.Book));
    }
}

// ── Purchase / Sales Stats ────────────────────────────────────────────────────

public record SalesPeriodDto(string Period, int Count, decimal Revenue);
public record TopSalesItemDto(Guid Id, string Title, string Type, int SoldCount, decimal Revenue);

public record SalesStatsResult(
    int TotalOrdersPaid,
    int OrdersThisWeek,
    int OrdersThisMonth,
    decimal RevenueThisWeek,
    decimal RevenueThisMonth,
    List<SalesPeriodDto> WeeklySales,
    List<TopSalesItemDto> TopCourses,
    List<TopSalesItemDto> TopBooks
);

public record GetSalesStatsQuery(int WeeksBack = 8) : IRequest<SalesStatsResult>;

public class GetSalesStatsHandler(IApplicationDbContext db)
    : IRequestHandler<GetSalesStatsQuery, SalesStatsResult>
{
    public async Task<SalesStatsResult> Handle(GetSalesStatsQuery req, CancellationToken ct)
    {
        var now        = DateTime.UtcNow;
        var weekStart  = now.Date.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var cutoff     = weekStart.AddDays(-7 * req.WeeksBack);

        var paidOrders = await db.Orders
            .Where(o => (o.Status == OrderStatus.Paid || o.Status == OrderStatus.Completed)
                     && o.PaidAt != null)
            .Select(o => new { o.Id, o.PaidAt, o.FinalAmount })
            .ToListAsync(ct);

        var totalPaid    = paidOrders.Count;
        var thisWeekOrd  = paidOrders.Count(o => o.PaidAt >= weekStart);
        var thisMonthOrd = paidOrders.Count(o => o.PaidAt >= monthStart);
        var thisWeekRev  = paidOrders.Where(o => o.PaidAt >= weekStart).Sum(o => o.FinalAmount);
        var thisMonthRev = paidOrders.Where(o => o.PaidAt >= monthStart).Sum(o => o.FinalAmount);

        var weekly = Enumerable.Range(0, req.WeeksBack)
            .Select(i =>
            {
                var ws = weekStart.AddDays(-7 * i);
                var we = ws.AddDays(7);
                var week = paidOrders.Where(o => o.PaidAt >= ws && o.PaidAt < we).ToList();
                return new SalesPeriodDto(ws.ToString("dd/MM"), week.Count, week.Sum(o => o.FinalAmount));
            })
            .OrderBy(w => w.Period)
            .ToList();

        // Top courses by paid enrollments
        var courseEnrollments = await db.CourseEnrollments
            .Where(e => e.Source == EnrollmentSource.Payment)
            .GroupBy(e => e.CourseId)
            .Select(g => new { CourseId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync(ct);

        var topCourses = courseEnrollments.Select(x =>
        {
            var title = db.Courses.Where(c => c.Id == x.CourseId).Select(c => c.Title).FirstOrDefault() ?? "Unknown";
            var rev = db.OrderItems
                .Where(i => i.CourseId == x.CourseId)
                .Join(db.Orders, i => i.OrderId, o => o.Id, (i, o) => new { i, o })
                .Where(x2 => x2.o.Status == OrderStatus.Paid || x2.o.Status == OrderStatus.Completed)
                .Sum(x2 => x2.i.TotalPrice);
            return new TopSalesItemDto(x.CourseId, title, "Course", x.Count, rev);
        }).ToList();

        // Top books by purchase
        var topBooksRaw = await db.Books
            .Where(b => b.PurchaseCount > 0)
            .OrderByDescending(b => b.PurchaseCount)
            .Take(10)
            .Select(b => new { b.Id, b.Title, b.PurchaseCount })
            .ToListAsync(ct);

        var topBooks = topBooksRaw.Select(b =>
        {
            var rev = db.OrderItems
                .Where(i => i.BookId == b.Id)
                .Join(db.Orders, i => i.OrderId, o => o.Id, (i, o) => new { i, o })
                .Where(x2 => x2.o.Status == OrderStatus.Paid || x2.o.Status == OrderStatus.Completed)
                .Sum(x2 => x2.i.TotalPrice);
            return new TopSalesItemDto(b.Id, b.Title, "Book", b.PurchaseCount, rev);
        }).ToList();

        return new SalesStatsResult(
            totalPaid, thisWeekOrd, thisMonthOrd,
            thisWeekRev, thisMonthRev,
            weekly, topCourses, topBooks);
    }
}
