using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Books;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record BookReviewDto(
    Guid   Id,
    Guid   UserId,
    string UserName,
    int    Rating,
    string? Title,
    string Content,
    bool   IsVerifiedPurchase,
    DateTime CreatedAt
);

public record BookReviewSummaryDto(
    decimal AverageRating,
    int     TotalReviews,
    int     Star5,
    int     Star4,
    int     Star3,
    int     Star2,
    int     Star1
);

public record BookReviewsResult(
    BookReviewSummaryDto Summary,
    List<BookReviewDto>  Reviews,
    int Total,
    int Page,
    int PageSize
);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetBookReviewsQuery(
    Guid BookId,
    int  Page     = 1,
    int  PageSize = 10
) : IRequest<BookReviewsResult>;

public record GetBookReviewSummaryQuery(Guid BookId) : IRequest<BookReviewSummaryDto>;

public record GetMyBookReviewQuery(Guid BookId, Guid UserId) : IRequest<BookReviewDto?>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateBookReviewCommand(
    Guid   BookId,
    Guid   UserId,
    int    Rating,
    string Content,
    string? Title
) : IRequest<BookReviewDto>;

public record UpdateBookReviewCommand(
    Guid   ReviewId,
    Guid   UserId,
    int    Rating,
    string Content,
    string? Title
) : IRequest<bool>;

public record DeleteBookReviewCommand(
    Guid   ReviewId,
    Guid   UserId,
    bool   IsAdmin = false
) : IRequest<bool>;

// ── Handlers ──────────────────────────────────────────────────────────────────

public class GetBookReviewsHandler(IApplicationDbContext db)
    : IRequestHandler<GetBookReviewsQuery, BookReviewsResult>
{
    public async Task<BookReviewsResult> Handle(GetBookReviewsQuery request, CancellationToken ct)
    {
        var all = db.BookReviews.Where(r => r.BookId == request.BookId);

        // Summary
        var ratings = await all.Select(r => r.Rating).ToListAsync(ct);
        var summary = new BookReviewSummaryDto(
            AverageRating: ratings.Count > 0 ? (decimal)Math.Round(ratings.Average(), 1) : 0m,
            TotalReviews:  ratings.Count,
            Star5: ratings.Count(x => x == 5),
            Star4: ratings.Count(x => x == 4),
            Star3: ratings.Count(x => x == 3),
            Star2: ratings.Count(x => x == 2),
            Star1: ratings.Count(x => x == 1)
        );

        var total = ratings.Count;

        // Paged reviews
        var reviews = await all
            .OrderByDescending(r => r.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new
            {
                r.Id, r.UserId, r.Rating, r.Title, r.Content,
                r.IsVerifiedPurchase, r.CreatedAt,
                UserName = r.User.Profile != null ? r.User.Profile.FullName : r.User.Email,
            })
            .ToListAsync(ct);

        return new BookReviewsResult(
            summary,
            reviews.Select(r => new BookReviewDto(
                r.Id, r.UserId, r.UserName, r.Rating, r.Title, r.Content, r.IsVerifiedPurchase, r.CreatedAt
            )).ToList(),
            total, request.Page, request.PageSize
        );
    }
}

public class GetMyBookReviewHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyBookReviewQuery, BookReviewDto?>
{
    public async Task<BookReviewDto?> Handle(GetMyBookReviewQuery request, CancellationToken ct)
    {
        var r = await db.BookReviews
            .Where(x => x.BookId == request.BookId && x.UserId == request.UserId)
            .Select(x => new
            {
                x.Id, x.UserId, x.Rating, x.Title, x.Content, x.IsVerifiedPurchase, x.CreatedAt,
                UserName = x.User.Profile != null ? x.User.Profile.FullName : x.User.Email,
            })
            .FirstOrDefaultAsync(ct);

        if (r is null) return null;
        return new BookReviewDto(r.Id, r.UserId, r.UserName, r.Rating, r.Title, r.Content, r.IsVerifiedPurchase, r.CreatedAt);
    }
}

public class CreateBookReviewHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBookReviewCommand, BookReviewDto>
{
    public async Task<BookReviewDto> Handle(CreateBookReviewCommand request, CancellationToken ct)
    {
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == request.BookId, ct)
            ?? throw new KeyNotFoundException("Book not found.");

        // Check duplicate
        var existing = await db.BookReviews
            .AnyAsync(r => r.BookId == request.BookId && r.UserId == request.UserId, ct);
        if (existing) throw new InvalidOperationException("Bạn đã đánh giá sách này rồi.");

        // Check verified purchase
        var isVerified = await db.EbookEntitlements
            .AnyAsync(e => e.BookId == request.BookId && e.UserId == request.UserId, ct)
            || await db.Orders
                .Join(db.OrderItems, o => o.Id, i => i.OrderId, (o, i) => new { o, i })
                .AnyAsync(x => x.o.UserId == request.UserId
                            && x.i.BookId == request.BookId
                            && x.o.Status == OrderStatus.Completed, ct);

        var review = BookReview.Create(
            request.BookId, request.UserId, request.Rating, request.Content,
            request.Title, isVerified);

        db.BookReviews.Add(review);

        // Recalculate book rating
        var allRatings = await db.BookReviews
            .Where(r => r.BookId == request.BookId)
            .Select(r => r.Rating)
            .ToListAsync(ct);
        allRatings.Add(review.Rating);
        book.UpdateRating((decimal)Math.Round(allRatings.Average(), 1), allRatings.Count);

        await db.SaveChangesAsync(ct);

        var user = await db.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);
        var name = user?.Profile?.FullName ?? user?.Email ?? "";

        return new BookReviewDto(review.Id, review.UserId, name, review.Rating,
            review.Title, review.Content, review.IsVerifiedPurchase, review.CreatedAt);
    }
}

public class UpdateBookReviewHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateBookReviewCommand, bool>
{
    public async Task<bool> Handle(UpdateBookReviewCommand request, CancellationToken ct)
    {
        var review = await db.BookReviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId && r.UserId == request.UserId, ct);
        if (review is null) return false;

        review.Update(request.Rating, request.Content, request.Title);

        // Recalculate book rating
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == review.BookId, ct);
        if (book is not null)
        {
            var allRatings = await db.BookReviews
                .Where(r => r.BookId == review.BookId)
                .Select(r => r.Rating)
                .ToListAsync(ct);
            book.UpdateRating((decimal)Math.Round(allRatings.Average(), 1), allRatings.Count);
        }

        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class DeleteBookReviewHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteBookReviewCommand, bool>
{
    public async Task<bool> Handle(DeleteBookReviewCommand request, CancellationToken ct)
    {
        var review = await db.BookReviews
            .FirstOrDefaultAsync(r => r.Id == request.ReviewId &&
                (request.IsAdmin || r.UserId == request.UserId), ct);
        if (review is null) return false;

        var bookId = review.BookId;
        db.BookReviews.Remove(review);
        await db.SaveChangesAsync(ct);

        // Recalculate book rating
        var book = await db.Books.FirstOrDefaultAsync(b => b.Id == bookId, ct);
        if (book is not null)
        {
            var allRatings = await db.BookReviews
                .Where(r => r.BookId == bookId)
                .Select(r => r.Rating)
                .ToListAsync(ct);
            var avg = allRatings.Count > 0 ? (decimal)Math.Round(allRatings.Average(), 1) : 0m;
            book.UpdateRating(avg, allRatings.Count);
            await db.SaveChangesAsync(ct);
        }

        return true;
    }
}
