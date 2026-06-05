using MediatR;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.CMS.Courses.Commands;
using MLS.Application.CMS.Courses.Queries;
using MLS.API.Filters;
using MLS.Domain.Interfaces;
namespace MLS.API.Controllers.Admin;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public record CreateCourseRequest(
    string Title, string? Description, int Level, Guid? TeacherId,
    decimal Price = 0, decimal? DiscountPrice = null, DateTime? DiscountEndsAt = null,
    string? ShortDescription = null, bool IsFree = false, bool CertificateEnabled = false,
    string Visibility = "Public",
    string? Code = null, string? Language = "VI", string? ThumbnailUrl = null,
    string? BannerUrl = null, string? Tags = null, int? Duration = null,
    DateTime? StartDate = null, DateTime? EndDate = null, bool CompletionRequired = false,
    string? Outcomes = null, string? Requirements = null, string? TargetAudience = null);
public record UpdateCourseRequest(
    string Title, string? Description, int Level, Guid? TeacherId,
    decimal Price = 0, decimal? DiscountPrice = null, DateTime? DiscountEndsAt = null,
    string? ShortDescription = null, bool IsFree = false, bool CertificateEnabled = false,
    string Visibility = "Public",
    string? ThumbnailUrl = null, string? BannerUrl = null, string? Language = null,
    string? Tags = null, int? Duration = null,
    DateTime? StartDate = null, DateTime? EndDate = null, bool CompletionRequired = false,
    string? Code = null,
    string? Outcomes = null, string? Requirements = null, string? TargetAudience = null);
public record CreateModuleRequest(string Title, string? Description, Guid? LevelId = null, string? ThumbnailUrl = null, int EstimatedDuration = 0);
public record UpdateModuleRequest(string Title, string? Description, int OrderIndex, bool IsLocked = false, Guid? LevelId = null, string? ThumbnailUrl = null, int EstimatedDuration = 0);
public record CreateLevelRequest(string Name, string? Description);
public record UpdateLevelRequest(string Name, string? Description, int OrderIndex);
public record CreateLearningLevelRequest(string Name, string? Description, int OrderIndex = 0);
public record UpdateLearningLevelRequest(string Name, string? Description, int OrderIndex);

// ── Course CMS Controller ─────────────────────────────────────────────────────

[ApiController]
[Route("api/v1/admin/cms")]
[AuthorizeRoles("Admin", "SuperAdmin", "ContentManager", "Teacher")]
public class AdminCmsController(IMediator mediator, ITenantContext tenantContext, IStorageService storage) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirst("sub")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? Guid.Empty.ToString());

    // ── Courses ──────────────────────────────────────────────────────────────

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? level = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCoursesQuery(page, pageSize, search, level, status), ct);
        return Ok(result);
    }

    [HttpGet("courses/{id:guid}")]
    public async Task<IActionResult> GetCourse(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCourseDetailQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("courses")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(
            new CreateCourseCommand(req.Title, req.Description, req.Level, req.TeacherId, CurrentUserId,
                req.Price, req.DiscountPrice, req.DiscountEndsAt,
                req.ShortDescription, req.IsFree, req.CertificateEnabled, req.Visibility,
                req.Code, req.Language, req.ThumbnailUrl, req.BannerUrl, req.Tags,
                req.Duration, req.StartDate, req.EndDate, req.CompletionRequired,
                req.Outcomes, req.Requirements, req.TargetAudience), ct);
        return CreatedAtAction(nameof(GetCourse), new { id }, new { id });
    }

    [HttpPut("courses/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateCourseCommand(id, req.Title, req.Description, req.Level, req.TeacherId,
            req.Price, req.DiscountPrice, req.DiscountEndsAt,
            req.ShortDescription, req.IsFree, req.CertificateEnabled, req.Visibility,
            req.ThumbnailUrl, req.BannerUrl, req.Language, req.Tags,
            req.Duration, req.StartDate, req.EndDate, req.CompletionRequired, req.Code,
            req.Outcomes, req.Requirements, req.TargetAudience), ct);
        return NoContent();
    }

    [HttpDelete("courses/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteCourseCommand(id), ct);
        return NoContent();
    }

    [HttpPut("courses/{id:guid}/publish")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> PublishCourse(Guid id, [FromQuery] bool approve = true, CancellationToken ct = default)
    {
        await mediator.Send(new PublishCourseCommand(id, approve), ct);
        return NoContent();
    }

    [HttpPost("courses/{id:guid}/submit")]
    public async Task<IActionResult> SubmitForReview(Guid id, CancellationToken ct)
    {
        await mediator.Send(new SubmitForReviewCommand(id), ct);
        return NoContent();
    }

    [HttpPost("courses/{id:guid}/clone")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> CloneCourse(Guid id, CancellationToken ct)
    {
        var newId = await mediator.Send(new CloneCourseCommand(id, CurrentUserId), ct);
        return CreatedAtAction(nameof(GetCourse), new { id = newId }, new { id = newId });
    }

    [HttpPut("courses/{id:guid}/hide")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> HideCourse(Guid id, CancellationToken ct)
    {
        await mediator.Send(new HideCourseCommand(id), ct);
        return NoContent();
    }

    [HttpPut("courses/{id:guid}/archive")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> ArchiveCourse(Guid id, CancellationToken ct)
    {
        await mediator.Send(new ArchiveCourseCommand(id), ct);
        return NoContent();
    }

    // ── Content Approvals Queue ───────────────────────────────────────────────

    [HttpGet("content/approvals")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> GetApprovals(CancellationToken ct)
    {
        var result = await mediator.Send(new GetApprovalsQueueQuery(), ct);
        return Ok(result);
    }

    // ── Modules ───────────────────────────────────────────────────────────────

    [HttpGet("modules/{id:guid}")]
    public async Task<IActionResult> GetModule(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetModuleDetailQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("courses/{courseId:guid}/modules")]
    public async Task<IActionResult> CreateModule(Guid courseId, [FromBody] CreateModuleRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateModuleCommand(courseId, req.Title, req.Description, req.LevelId, req.ThumbnailUrl, req.EstimatedDuration), ct);
        return CreatedAtAction(nameof(GetModule), new { id }, new { id });
    }

    [HttpPut("modules/{id:guid}")]
    public async Task<IActionResult> UpdateModule(Guid id, [FromBody] UpdateModuleRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateModuleCommand(id, req.Title, req.Description, req.OrderIndex, req.IsLocked, req.LevelId, req.ThumbnailUrl, req.EstimatedDuration), ct);
        return NoContent();
    }

    [HttpDelete("modules/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin", "Teacher")]
    public async Task<IActionResult> DeleteModule(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteModuleCommand(id), ct);
        return NoContent();
    }

    // ── Levels ────────────────────────────────────────────────────────────────

    [HttpGet("courses/{courseId:guid}/levels")]
    public async Task<IActionResult> GetCourseLevels(Guid courseId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCourseLevelsQuery(courseId), ct);
        return Ok(result);
    }

    [HttpGet("levels/{id:guid}")]
    public async Task<IActionResult> GetLevel(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetLevelDetailQuery(id), ct);
        return Ok(result);
    }

    [HttpPost("courses/{courseId:guid}/levels")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> CreateLevel(Guid courseId, [FromBody] CreateLevelRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateLevelCommand(courseId, req.Name, req.Description), ct);
        return CreatedAtAction(nameof(GetLevel), new { id }, new { id });
    }

    [HttpPut("levels/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> UpdateLevel(Guid id, [FromBody] UpdateLevelRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateLevelCommand(id, req.Name, req.Description, req.OrderIndex), ct);
        return NoContent();
    }

    [HttpPut("levels/{id:guid}/publish")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> PublishLevel(Guid id, [FromQuery] bool publish = true, CancellationToken ct = default)
    {
        await mediator.Send(new PublishLevelCommand(id, publish), ct);
        return NoContent();
    }

    [HttpDelete("levels/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> DeleteLevel(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteLevelCommand(id), ct);
        return NoContent();
    }

    // ── Learning Level (global config) ──────────────────────────────────────

    [HttpGet("learning-levels")]
    public async Task<IActionResult> GetLearningLevels([FromQuery] bool includeInactive = false, CancellationToken ct = default)
        => Ok(await mediator.Send(new GetLearningLevelsQuery(includeInactive), ct));

    [HttpPost("learning-levels")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> CreateLearningLevel([FromBody] CreateLearningLevelRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateLearningLevelCommand(req.Name, req.Description, req.OrderIndex), ct);
        return Ok(new { id });
    }

    [HttpPut("learning-levels/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> UpdateLearningLevel(Guid id, [FromBody] UpdateLearningLevelRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpdateLearningLevelCommand(id, req.Name, req.Description, req.OrderIndex), ct);
        return NoContent();
    }

    [HttpPut("learning-levels/{id:guid}/active")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> SetLearningLevelActive(Guid id, [FromQuery] bool active, CancellationToken ct)
    {
        await mediator.Send(new SetLearningLevelActiveCommand(id, active), ct);
        return NoContent();
    }

    [HttpDelete("learning-levels/{id:guid}")]
    [AuthorizeRoles("Admin", "SuperAdmin")]
    public async Task<IActionResult> DeleteLearningLevel(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteLearningLevelCommand(id), ct);
        return NoContent();
    }

    // ── Thumbnail upload ──────────────────────────────────────────────────────

    [HttpPost("upload-thumbnail")]
    [RequestFormLimits(MultipartBodyLengthLimit = 5_242_880)]
    public async Task<IActionResult> UploadThumbnail(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        string[] allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { error = "Only JPEG, PNG, WebP, or GIF images are allowed." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { error = "File size must not exceed 5MB." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";
        var safeFileName = $"thumb_{Guid.NewGuid():N}{ext}";

        var relativePath = await storage.UploadAsync(
            tenantContext.TenantSlug, "thumbnails", safeFileName,
            file.OpenReadStream(), file.ContentType, ct);

        return Ok(new { url = $"/media/{relativePath}" });
    }
}
