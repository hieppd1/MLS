using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.CMS.Sessions.Commands;
using MLS.Application.CMS.Sessions.Queries;
using MLS.Application.CMS.Segments.Commands;
using MLS.Application.CMS.LearningAssets.Commands;
using MLS.Application.CMS.LearningAssets.Queries;
using MLS.Domain.Interfaces;

namespace MLS.API.Controllers.Admin;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreateSessionRequest(
    string Title,
    string? Description,
    bool IsFreeTrial = false,
    string? ThumbnailUrl = null,
    string SessionType = "Interactive",
    string? Content = null,
    string? AudioUrl = null,
    string? DocumentUrl = null,
    string? Transcript = null,
    int PassScore = 70,
    int DurationMinutes = 0);

public record UpdateSessionRequest(
    string Title,
    string? Description,
    bool IsFreeTrial,
    string? ThumbnailUrl,
    string? SessionType = null,
    string? Content = null,
    string? AudioUrl = null,
    string? DocumentUrl = null,
    string? Transcript = null,
    int PassScore = 70,
    int DurationMinutes = 0);

public record ReorderRequest(List<Guid> OrderedIds);

public record CreateSegmentRequest(
    string Title,
    string? Description,
    int StartTime,
    int EndTime);

public record UpdateSegmentRequest(
    string Title,
    string? Description,
    int StartTime,
    int EndTime);

public record CreateLearningAssetRequest(
    string Type,
    string Title,
    string? Description,
    int StartTime,
    int? EndTime = null,
    string Metadata = "{}",
    bool IsPublic = true);

public record UpdateLearningAssetRequest(
    string Title,
    string? Description,
    int StartTime,
    int? EndTime,
    string Metadata,
    bool IsPublic);

// ── Admin CMS Sessions Controller ─────────────────────────────────────────────

[ApiController]
[Route("api/v1/admin/cms")]
[AuthorizeRoles("Admin", "SuperAdmin", "ContentManager", "Teacher")]
public class AdminCmsSessionsController(IMediator mediator, ITenantContext tenantContext) : ControllerBase
{
    // ── Sessions ──────────────────────────────────────────────────────────────

    [HttpGet("modules/{moduleId:guid}/sessions")]
    public async Task<IActionResult> GetSessions(Guid moduleId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionsByModuleQuery(moduleId), ct);
        return Ok(result);
    }

    [HttpPost("modules/{moduleId:guid}/sessions")]
    public async Task<IActionResult> CreateSession(Guid moduleId, [FromBody] CreateSessionRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateSessionCommand(
            moduleId, req.Title, req.Description, req.IsFreeTrial, req.ThumbnailUrl,
            req.SessionType, req.Content, req.AudioUrl, req.DocumentUrl,
            req.Transcript, req.PassScore, req.DurationMinutes), ct);
        return CreatedAtAction(nameof(GetSession), new { id }, new { id });
    }

    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSession(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionDetailQuery(id), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("sessions/{id:guid}")]
    public async Task<IActionResult> UpdateSession(Guid id, [FromBody] UpdateSessionRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateSessionCommand(id, req.Title, req.Description, req.IsFreeTrial, req.ThumbnailUrl,
            req.SessionType, req.Content, req.AudioUrl, req.DocumentUrl,
            req.Transcript, req.PassScore, req.DurationMinutes), ct);
        return NoContent();
    }

    [HttpDelete("sessions/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> DeleteSession(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteSessionCommand(id), ct);
        return NoContent();
    }

    [HttpPost("sessions/{id:guid}/publish")]
    public async Task<IActionResult> PublishSession(Guid id, CancellationToken ct)
    {
        await mediator.Send(new PublishSessionCommand(id, true), ct);
        return NoContent();
    }

    [HttpPost("sessions/{id:guid}/unpublish")]
    public async Task<IActionResult> UnpublishSession(Guid id, CancellationToken ct)
    {
        await mediator.Send(new PublishSessionCommand(id, false), ct);
        return NoContent();
    }

    [HttpPut("modules/{moduleId:guid}/sessions/reorder")]
    public async Task<IActionResult> ReorderSessions(Guid moduleId, [FromBody] ReorderRequest req, CancellationToken ct)
    {
        await mediator.Send(new ReorderSessionsCommand(moduleId, req.OrderedIds), ct);
        return NoContent();
    }

    [HttpPost("sessions/{sessionId:guid}/video")]
    [RequestSizeLimit(2_147_483_648)]
    [RequestFormLimits(MultipartBodyLengthLimit = 2_147_483_648)]
    public async Task<IActionResult> UploadSessionVideo(Guid sessionId, IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        await using var stream = file.OpenReadStream();
        var id = await mediator.Send(new CreateSessionVideoAssetCommand(
            sessionId, file.FileName, file.Length, stream, file.ContentType,
            tenantContext.TenantSlug), ct);

        return Ok(new { id, status = "Ready" });
    }

    // ── Segments ──────────────────────────────────────────────────────────────

    [HttpGet("sessions/{sessionId:guid}/segments")]
    public async Task<IActionResult> GetSegmentsInSession(Guid sessionId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetSessionDetailQuery(sessionId), ct);
        if (result == null) return NotFound();
        return Ok(result.Segments);
    }

    [HttpPost("sessions/{sessionId:guid}/segments")]
    public async Task<IActionResult> CreateSegment(Guid sessionId, [FromBody] CreateSegmentRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateSegmentCommand(
            sessionId, req.Title, req.Description, req.StartTime, req.EndTime), ct);
        return CreatedAtAction(nameof(GetSession), new { id = sessionId }, new { id });
    }

    [HttpPut("segments/{id:guid}")]
    public async Task<IActionResult> UpdateSegment(Guid id, [FromBody] UpdateSegmentRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateSegmentCommand(id, req.Title, req.Description, req.StartTime, req.EndTime), ct);
        return NoContent();
    }

    [HttpDelete("segments/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> DeleteSegment(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteSegmentCommand(id), ct);
        return NoContent();
    }

    [HttpPut("sessions/{sessionId:guid}/segments/reorder")]
    public async Task<IActionResult> ReorderSegments(Guid sessionId, [FromBody] ReorderRequest req, CancellationToken ct)
    {
        await mediator.Send(new ReorderSegmentsCommand(sessionId, req.OrderedIds), ct);
        return NoContent();
    }

    // ── LearningAssets ────────────────────────────────────────────────────────

    [HttpGet("segments/{segmentId:guid}/assets")]
    public async Task<IActionResult> GetAssets(Guid segmentId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetLearningAssetsBySegmentQuery(segmentId), ct);
        return Ok(result);
    }

    [HttpPost("segments/{segmentId:guid}/assets")]
    public async Task<IActionResult> CreateAsset(Guid segmentId, [FromBody] CreateLearningAssetRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateLearningAssetCommand(
            segmentId, req.Type, req.Title, req.Description, req.StartTime, req.EndTime, req.Metadata, req.IsPublic), ct);
        return CreatedAtAction(nameof(GetAsset), new { id }, new { id });
    }

    [HttpGet("assets/{id:guid}")]
    public async Task<IActionResult> GetAsset(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetLearningAssetDetailQuery(id), ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("assets/{id:guid}")]
    public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] UpdateLearningAssetRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateLearningAssetCommand(id, req.Title, req.Description, req.StartTime, req.EndTime, req.Metadata, req.IsPublic), ct);
        return NoContent();
    }

    [HttpDelete("assets/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> DeleteAsset(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteLearningAssetCommand(id), ct);
        return NoContent();
    }

    [HttpPost("assets/{id:guid}/upload-file")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> UploadAssetFile(Guid id, IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");

        var tenantSlug = HttpContext.Request.Headers["X-Tenant-Slug"].FirstOrDefault() ?? "default";

        var path = await mediator.Send(new UploadAssetFileCommand(
            id,
            file.FileName,
            file.Length,
            file.OpenReadStream(),
            file.ContentType,
            tenantSlug), ct);

        return Ok(new { filePath = path });
    }

    [HttpPut("segments/{segmentId:guid}/assets/reorder")]
    public async Task<IActionResult> ReorderAssets(Guid segmentId, [FromBody] ReorderRequest req, CancellationToken ct)
    {
        await mediator.Send(new ReorderLearningAssetsCommand(segmentId, req.OrderedIds), ct);
        return NoContent();
    }
}
