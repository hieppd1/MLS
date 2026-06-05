using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Books;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/books/{bookId:guid}/reviews")]
public class BookReviewsController(IMediator mediator) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var raw = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return raw is not null && Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    // GET /api/v1/books/{bookId}/reviews
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(
        Guid bookId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBookReviewsQuery(bookId, page, pageSize), ct);
        return Ok(result);
    }

    // GET /api/v1/books/{bookId}/reviews/mine
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMyReview(Guid bookId, CancellationToken ct = default)
    {
        if (CurrentUserId is null) return Unauthorized();
        var result = await mediator.Send(new GetMyBookReviewQuery(bookId, CurrentUserId.Value), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // POST /api/v1/books/{bookId}/reviews
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateReview(
        Guid bookId,
        [FromBody] BookCreateReviewRequest req,
        CancellationToken ct = default)
    {
        if (CurrentUserId is null) return Unauthorized();
        try
        {
            var result = await mediator.Send(
                new CreateBookReviewCommand(bookId, CurrentUserId.Value, req.Rating, req.Content, req.Title), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // PUT /api/v1/books/{bookId}/reviews/{reviewId}
    [HttpPut("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateReview(
        Guid bookId,
        Guid reviewId,
        [FromBody] BookCreateReviewRequest req,
        CancellationToken ct = default)
    {
        if (CurrentUserId is null) return Unauthorized();
        var ok = await mediator.Send(
            new UpdateBookReviewCommand(reviewId, CurrentUserId.Value, req.Rating, req.Content, req.Title), ct);
        return ok ? NoContent() : NotFound();
    }

    // DELETE /api/v1/books/{bookId}/reviews/{reviewId}
    [HttpDelete("{reviewId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(
        Guid bookId,
        Guid reviewId,
        CancellationToken ct = default)
    {
        if (CurrentUserId is null) return Unauthorized();
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
        var ok = await mediator.Send(
            new DeleteBookReviewCommand(reviewId, CurrentUserId.Value, isAdmin), ct);
        return ok ? NoContent() : NotFound();
    }
}

public record BookCreateReviewRequest(int Rating, string Content, string? Title = null);
