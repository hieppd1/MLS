using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.API.Filters;
using MLS.Application.Admin.Analytics;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/analytics")]
[AuthorizeRoles("Admin", "SuperAdmin")]
public class AdminAnalyticsController(IMediator mediator) : ControllerBase
{
    // GET /api/v1/admin/analytics?days=30
    [HttpGet]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] int days = 30,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAdminAnalyticsQuery(days), ct);
        return Ok(result);
    }

    // GET /api/v1/admin/analytics/users?weeksBack=12
    [HttpGet("users")]
    public async Task<IActionResult> GetUserStats(
        [FromQuery] int weeksBack = 12,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetUserStatsQuery(weeksBack), ct);
        return Ok(result);
    }

    // GET /api/v1/admin/analytics/content-views?weeksBack=8
    [HttpGet("content-views")]
    public async Task<IActionResult> GetContentViewStats(
        [FromQuery] int weeksBack = 8,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetContentViewStatsQuery(weeksBack), ct);
        return Ok(result);
    }

    // GET /api/v1/admin/analytics/sales?weeksBack=8
    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesStats(
        [FromQuery] int weeksBack = 8,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetSalesStatsQuery(weeksBack), ct);
        return Ok(result);
    }
}
