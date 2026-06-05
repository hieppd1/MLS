using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.OPIC.Commands;
using MLS.Application.OPIC.Queries;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/opic")]
[Authorize]
public class OPICController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── Survey ────────────────────────────────────────────────────────────────

    /// <summary>Save (upsert) background survey — topics + target level.</summary>
    [HttpPost("survey")]
    public async Task<IActionResult> SaveSurvey([FromBody] SaveSurveyRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new SaveSurveyCommand(
            CurrentUserId, req.SelectedTopics, req.TargetLevel,
            req.ChosenDifficulty, req.Language ?? "vi"), ct);
        return Ok(result);
    }

    /// <summary>Get my current survey.</summary>
    [HttpGet("survey/my")]
    public async Task<IActionResult> GetMySurvey([FromQuery] string language = "vi", CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMySurveyQuery(CurrentUserId, language), ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Return the full list of available OPIC topics.</summary>
    [HttpGet("topics")]
    [AllowAnonymous]
    public IActionResult GetTopics()
    {
        return Ok(new
        {
            SurveyTopics = OPICTopics.Survey,
            CommonTopics = OPICTopics.Common,
        });
    }

    // ── Session ───────────────────────────────────────────────────────────────

    /// <summary>Create a new OPIC session (after completing survey).</summary>
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateSessionCommand(
            CurrentUserId, req.SurveyId, req.ChosenDifficulty, req.Language ?? "vi", req.QuizId), ct);
        return Ok(result);
    }

    /// <summary>Get session detail (state, combos, attempt refs).</summary>
    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSession(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionQuery(id, CurrentUserId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>List my OPIC sessions (history).</summary>
    [HttpGet("sessions/my-history")]
    public async Task<IActionResult> GetMyHistory(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new ListMySessionsQuery(CurrentUserId, page, pageSize), ct);
        return Ok(result);
    }

    /// <summary>Submit mid-quiz difficulty adjustment (after question 7).</summary>
    [HttpPost("sessions/{id:guid}/mid-adjust")]
    public async Task<IActionResult> MidAdjust(Guid id, [FromBody] MidAdjustRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new MidAdjustCommand(id, CurrentUserId, req.Choice), ct);
        return Ok(result);
    }

    /// <summary>Record an attempt reference (question answered → link to session).</summary>
    [HttpPost("sessions/{id:guid}/attempt-ref")]
    public async Task<IActionResult> RecordAttemptRef(
        Guid id, [FromBody] RecordAttemptRefRequest req, CancellationToken ct)
    {
        await mediator.Send(new RecordAttemptRefCommand(id, req.AttemptId, req.QuestionIndex), ct);
        return NoContent();
    }

    /// <summary>Finalize session — aggregate scores and assign OPIC level.</summary>
    [HttpPost("sessions/{id:guid}/finalize")]
    public async Task<IActionResult> FinalizeSession(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new FinalizeSessionCommand(id, CurrentUserId), ct);
        return Ok(result);
    }

    // ── Results ───────────────────────────────────────────────────────────────

    /// <summary>Get my latest OPIC level result.</summary>
    [HttpGet("results/my-latest")]
    public async Task<IActionResult> GetMyLatestResult(
        [FromQuery] string language = "vi", CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMyLatestResultQuery(CurrentUserId, language), ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Get detailed result by session.</summary>
    [HttpGet("results/{sessionId:guid}")]
    public async Task<IActionResult> GetResult(Guid sessionId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionResultQuery(sessionId, CurrentUserId), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // ── Script Templates ──────────────────────────────────────────────────────

    /// <summary>Get published script templates (for students to study).</summary>
    [HttpGet("scripts")]
    [AllowAnonymous]
    public async Task<IActionResult> GetScripts(
        [FromQuery] string? topic    = null,
        [FromQuery] string? language = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetScriptTemplatesQuery(topic, language, true), ct);
        return Ok(result);
    }

    // ── Teacher endpoints ─────────────────────────────────────────────────────

    /// <summary>Teacher: create a script template.</summary>
    [HttpPost("teacher/scripts")]
    public async Task<IActionResult> CreateScript(
        [FromBody] CreateScriptRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateScriptTemplateCommand(
            CurrentUserId, req.TopicCategory, req.ComboType,
            req.OpeningTemplate, req.BodyTemplate, req.ClosingTemplate,
            req.TargetLevel, req.VocabList, req.UsefulPhrases, req.Language ?? "vi"), ct);
        return Ok(result);
    }

    /// <summary>Teacher: get all scripts (including unpublished).</summary>
    [HttpGet("teacher/scripts")]
    public async Task<IActionResult> GetAllScripts(
        [FromQuery] string? topic    = null,
        [FromQuery] string? language = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetScriptTemplatesQuery(topic, language, false), ct);
        return Ok(result);
    }

    // ── Demo / Simulation endpoints ───────────────────────────────────────────

    /// <summary>Return the Vietnamese OPIC demo quiz questions (for simulation UI).</summary>
    [HttpGet("demo-questions")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDemoQuestions(
        [FromQuery] string language = "vi",
        [FromQuery] Guid?  quizId   = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetOPICDemoQuestionsQuery(language, quizId), ct);
        return Ok(result);
    }

    /// <summary>List published OPIC quizzes available for students to choose.</summary>
    [AllowAnonymous]
    [HttpGet("quizzes/published")]
    public async Task<IActionResult> GetPublishedQuizzes(
        [FromQuery] string language = "vi",
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetPublishedOPICQuizzesQuery(language), ct);
        return Ok(result);
    }

    /// <summary>
    /// Simulate completing an OPIC session without real AI grading.
    /// Generates mock scores based on the session's chosen difficulty.
    /// Use for demo/testing only.
    /// </summary>
    [HttpPost("sessions/{id:guid}/simulate-complete")]
    public async Task<IActionResult> SimulateComplete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new SimulateCompleteCommand(id, CurrentUserId), ct);
        return Ok(result);
    }
}

// ── Request models ─────────────────────────────────────────────────────────────

public record SaveSurveyRequest(
    string[]  SelectedTopics,
    string?   TargetLevel,
    int       ChosenDifficulty,
    string?   Language);

public record CreateSessionRequest(
    Guid?   SurveyId,
    int     ChosenDifficulty,
    string? Language,
    Guid?   QuizId = null);

public record MidAdjustRequest(string Choice);   // "easier"|"same"|"harder"

public record RecordAttemptRefRequest(Guid AttemptId, int QuestionIndex);

public record CreateScriptRequest(
    string  TopicCategory,
    string  ComboType,
    string  OpeningTemplate,
    string  BodyTemplate,
    string  ClosingTemplate,
    string? TargetLevel,
    string? VocabList,
    string? UsefulPhrases,
    string? Language);

// ── Static topic catalogue ─────────────────────────────────────────────────────

public static class OPICTopics
{
    public static readonly string[] Survey =
    [
        "music", "movies", "sports", "reading", "cooking", "travel",
        "technology", "shopping", "health", "education", "pets", "hobbies",
        "fashion", "environment", "family", "volunteering",
    ];

    public static readonly string[] Common =
    [
        "bank", "restaurant", "hotel", "transportation", "apartment",
        "job_interview", "workplace", "leisure", "news_media", "social_issues",
        "internet", "holidays", "campus_life", "healthcare", "recycling",
        "climate_change", "remote_work", "digital_life", "food_culture", "art_culture",
    ];
}
