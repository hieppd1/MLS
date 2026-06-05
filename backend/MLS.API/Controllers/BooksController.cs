using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Admin.Analytics;
using MLS.Application.Books.Queries;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

/// <summary>
/// Public book catalog API.
/// </summary>
[ApiController]
[Route("api/v1/books")]
public class BooksController(IMediator mediator) : ControllerBase
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

    // GET /api/v1/books
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? type = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] string? sort = "newest",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetPublicBooksQuery(page, pageSize, search, categoryId, type, minPrice, maxPrice, minRating, sort, CurrentUserId), ct);
        return Ok(result);
    }

    // GET /api/v1/books/categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories(CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBookCategoriesQuery(), ct);
        return Ok(result);
    }

    // GET /api/v1/books/{slug}
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBook(string slug, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetBookBySlugQuery(slug, CurrentUserId), ct);
        if (result == null) return NotFound();
        _ = mediator.Send(new RecordContentViewCommand(ContentViewType.Book, result.Id, CurrentUserId), ct);
        return Ok(result);
    }
}
