using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Realtime.Commands;
using MLS.Application.Realtime.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/realtime")]
[Authorize]
public class RealtimeController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Create Room (Teacher) ──────────────────────────────────────────────────

    /// <summary>
    /// Teacher creates a realtime quiz room.
    /// Returns { roomId, roomCode, state, participantCount, currentQuestionIndex }
    /// </summary>
    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateRoomCommand(req.QuizId, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Get Room Info ──────────────────────────────────────────────────────────

    /// <summary>
    /// Get room details by code. No auth required so students can preview before joining.
    /// </summary>
    [HttpGet("rooms/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRoom(string code, CancellationToken ct)
    {
        var result = await mediator.Send(new GetRoomByCodeQuery(code), ct);
        return result == null ? NotFound() : Ok(result);
    }

    // ── Join Room (Student) ────────────────────────────────────────────────────

    [HttpPost("rooms/{code}/join")]
    public async Task<IActionResult> JoinRoom(string code, CancellationToken ct)
    {
        var result = await mediator.Send(new JoinRoomCommand(code, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Start Room (Host) ──────────────────────────────────────────────────────

    [HttpPost("rooms/{id:guid}/start")]
    public async Task<IActionResult> StartRoom(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new StartRoomCommand(id, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Next Question (Host) ───────────────────────────────────────────────

    [HttpPost("rooms/{id:guid}/next")]
    public async Task<IActionResult> NextQuestion(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new NextQuestionCommand(id, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Submit Answer (Student) ────────────────────────────────────────────────

    [HttpPost("rooms/{id:guid}/answer")]
    public async Task<IActionResult> SubmitAnswer(
        Guid id,
        [FromBody] RealtimeAnswerRequest req,
        CancellationToken ct)
    {
        var result = await mediator.Send(new SubmitRealtimeAnswerCommand(
            RoomId:           id,
            UserId:           CurrentUserId,
            QuestionId:       req.QuestionId,
            SelectedOptionId: req.SelectedOptionId,
            TimeTakenMs:      req.TimeTakenMs), ct);

        return Ok(result);
    }

    // ── Leaderboard (REST fallback) ────────────────────────────────────────────

    [HttpGet("rooms/{id:guid}/leaderboard")]
    public async Task<IActionResult> GetLeaderboard(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetLeaderboardQuery(id), ct);
        return Ok(result);
    }
}

public record CreateRoomRequest(Guid QuizId);
public record RealtimeAnswerRequest(Guid QuestionId, Guid? SelectedOptionId, long TimeTakenMs);
