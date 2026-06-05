using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.CMS.Reviews;

// ── Create Review ─────────────────────────────────────────────────────────────

public record CreateReviewCommand(
    Guid CourseId,
    Guid UserId,
    int Rating,
    string? Title,
    string Content) : IRequest<ReviewDto>;

public class CreateReviewHandler(IApplicationDbContext db)
    : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    public async Task<ReviewDto> Handle(CreateReviewCommand cmd, CancellationToken ct)
    {
        // One review per user per course
        var existing = await db.CourseReviews
            .FirstOrDefaultAsync(r => r.CourseId == cmd.CourseId && r.UserId == cmd.UserId, ct);
        if (existing != null)
            throw new InvalidOperationException("Bạn đã đánh giá khóa học này rồi.");

        // Check enrollment
        var isEnrolled = await db.CourseEnrollments
            .AnyAsync(e => e.CourseId == cmd.CourseId && e.UserId == cmd.UserId, ct);

        var review = CourseReview.Create(
            cmd.CourseId, cmd.UserId, cmd.Rating, cmd.Content, cmd.Title,
            isVerifiedPurchase: isEnrolled);

        db.CourseReviews.Add(review);
        await db.SaveChangesAsync(ct);

        // Reload with navigation
        var saved = await db.CourseReviews
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .FirstAsync(r => r.Id == review.Id, ct);

        return GetCourseReviewsHandler.MapDto(saved);
    }
}

// ── Update Review ─────────────────────────────────────────────────────────────

public record UpdateReviewCommand(
    Guid ReviewId,
    Guid UserId,
    int Rating,
    string? Title,
    string Content) : IRequest<ReviewDto>;

public class UpdateReviewHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateReviewCommand, ReviewDto>
{
    public async Task<ReviewDto> Handle(UpdateReviewCommand cmd, CancellationToken ct)
    {
        var review = await db.CourseReviews
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(r => r.Id == cmd.ReviewId && r.UserId == cmd.UserId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đánh giá.");

        review.Update(cmd.Rating, cmd.Content, cmd.Title);
        await db.SaveChangesAsync(ct);

        return GetCourseReviewsHandler.MapDto(review);
    }
}

// ── Delete Review ─────────────────────────────────────────────────────────────

public record DeleteReviewCommand(Guid ReviewId, Guid UserId) : IRequest;

public class DeleteReviewHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteReviewCommand>
{
    public async Task Handle(DeleteReviewCommand cmd, CancellationToken ct)
    {
        var review = await db.CourseReviews
            .FirstOrDefaultAsync(r => r.Id == cmd.ReviewId && r.UserId == cmd.UserId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đánh giá.");

        db.CourseReviews.Remove(review);
        await db.SaveChangesAsync(ct);
    }
}
