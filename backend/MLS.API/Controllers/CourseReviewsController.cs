using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.CMS.Reviews;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/courses/{courseId:guid}/reviews")]
public class CourseReviewsController(IMediator mediator) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var val = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return val != null ? Guid.Parse(val) : null;
        }
    }

    // GET /api/v1/courses/{courseId}/reviews?page=1&pageSize=10
    [HttpGet]
    public async Task<IActionResult> GetReviews(Guid courseId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var (items, total) = await mediator.Send(new GetCourseReviewsQuery(courseId, page, pageSize), ct);
        return Ok(new { items, total, page, pageSize });
    }

    // GET /api/v1/courses/{courseId}/reviews/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(Guid courseId, CancellationToken ct = default)
    {
        var stats = await mediator.Send(new GetReviewStatsQuery(courseId), ct);
        return Ok(stats);
    }

    // GET /api/v1/courses/{courseId}/reviews/mine
    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(Guid courseId, CancellationToken ct = default)
    {
        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();
        var review = await mediator.Send(new GetMyReviewQuery(courseId, userId.Value), ct);
        return Ok(review);
    }

    // POST /api/v1/courses/{courseId}/reviews
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(Guid courseId, [FromBody] CreateReviewRequest req, CancellationToken ct = default)
    {
        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var review = await mediator.Send(
                new CreateReviewCommand(courseId, userId.Value, req.Rating, req.Title, req.Content), ct);
            return Ok(review);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    // PUT /api/v1/courses/{courseId}/reviews/{reviewId}
    [Authorize]
    [HttpPut("{reviewId:guid}")]
    public async Task<IActionResult> Update(Guid courseId, Guid reviewId, [FromBody] CreateReviewRequest req, CancellationToken ct = default)
    {
        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();
        try
        {
            var review = await mediator.Send(
                new UpdateReviewCommand(reviewId, userId.Value, req.Rating, req.Title, req.Content), ct);
            return Ok(review);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/v1/courses/{courseId}/reviews/{reviewId}
    [Authorize]
    [HttpDelete("{reviewId:guid}")]
    public async Task<IActionResult> Delete(Guid courseId, Guid reviewId, CancellationToken ct = default)
    {
        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();
        try
        {
            await mediator.Send(new DeleteReviewCommand(reviewId, userId.Value), ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public record CreateReviewRequest(int Rating, string? Title, string Content);
