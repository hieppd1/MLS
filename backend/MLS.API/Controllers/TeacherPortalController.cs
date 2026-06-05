using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.CMS.Courses.Commands;
using MLS.Application.Teacher.Queries;

namespace MLS.API.Controllers;

public record TeacherCreateCourseRequest(
    string Title, string? Description, int Level,
    decimal Price = 0, decimal? DiscountPrice = null,
    string? ShortDescription = null, bool IsFree = false, bool CertificateEnabled = false,
    string Visibility = "Public",
    string? Code = null, string? Language = "VI", string? ThumbnailUrl = null,
    string? Tags = null, bool CompletionRequired = false);

/// <summary>
/// Teacher Portal — self-service endpoints for teachers to manage their own content.
/// All endpoints require Teacher or Admin role.
/// </summary>
[ApiController]
[Authorize]
public class TeacherPortalController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    // ── My Courses ────────────────────────────────────────────────────────────

    /// <summary>Get courses created by or assigned to the currently logged-in teacher.</summary>
    [HttpGet("api/v1/teacher/portal/courses")]
    public async Task<IActionResult> GetMyCourses(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyTeacherCoursesQuery(CurrentUserId), ct);
        return Ok(result);
    }

    /// <summary>Create a new course assigned to the currently logged-in teacher.</summary>
    [HttpPost("api/v1/teacher/portal/courses")]
    public async Task<IActionResult> CreateCourse([FromBody] TeacherCreateCourseRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(
            new CreateCourseCommand(
                req.Title, req.Description, req.Level,
                TeacherId: CurrentUserId, CreatedBy: CurrentUserId,
                req.Price, req.DiscountPrice, DiscountEndsAt: null,
                req.ShortDescription, req.IsFree, req.CertificateEnabled, req.Visibility,
                req.Code, req.Language, ThumbnailUrl: req.ThumbnailUrl, BannerUrl: null, req.Tags,
                Duration: null, StartDate: null, EndDate: null, req.CompletionRequired,
                Outcomes: null, Requirements: null, TargetAudience: null), ct);
        return Ok(new { id });
    }

    // ── OPIC Teacher Analytics ────────────────────────────────────────────────

    /// <summary>Aggregate OPIC analytics: level distribution, avg skill scores.</summary>
    [HttpGet("api/v1/teacher/opic/analytics")]
    public async Task<IActionResult> GetOPICAnalytics(CancellationToken ct)
    {
        var result = await mediator.Send(new GetOPICTeacherAnalyticsQuery(), ct);
        return Ok(result);
    }

    /// <summary>Paginated list of all students' OPIC results.</summary>
    [HttpGet("api/v1/teacher/opic/students")]
    public async Task<IActionResult> GetOPICStudents(
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetOPICStudentResultsQuery(page, pageSize), ct);
        return Ok(result);
    }
}
