using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Quiz.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/quiz-analytics")]
[Authorize]
public class QuizAnalyticsController(IMediator mediator) : ControllerBase
{
    // ── Per-quiz analytics ────────────────────────────────────────────────────

    [HttpGet("quizzes/{quizId:guid}")]
    public async Task<IActionResult> GetQuizAnalytics(Guid quizId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetQuizAnalyticsQuery(quizId), ct);
        return result == null ? NotFound() : Ok(result);
    }

    // ── My attempts summary across all quizzes ────────────────────────────────

    [HttpGet("my-attempts/{quizId:guid}")]
    public async Task<IActionResult> GetMyAttempts(Guid quizId, CancellationToken ct)
    {
        var userId = Guid.Parse(
            User.FindFirst("sub")?.Value
         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        return Ok(await mediator.Send(new GetMyAttemptsQuery(quizId, userId), ct));
    }
}
