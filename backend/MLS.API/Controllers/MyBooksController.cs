using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.MyBooks.Queries;
using System.Security.Claims;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/my-books")]
[Authorize]
public class MyBooksController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                   User.FindFirstValue("sub") ??
                   throw new UnauthorizedAccessException());

    /// <summary>GET /api/v1/my-books/ebooks — list purchased/activated ebooks</summary>
    [HttpGet("ebooks")]
    public async Task<IActionResult> GetMyEbooks(CancellationToken ct)
    {
        var ebooks = await mediator.Send(new GetMyEbooksQuery(CurrentUserId), ct);
        return Ok(ebooks);
    }
}
