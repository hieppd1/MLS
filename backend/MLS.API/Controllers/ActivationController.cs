using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Activation.Commands;
using System.Security.Claims;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/activation")]
public class ActivationController(IMediator mediator) : ControllerBase
{
    private Guid? CurrentUserId
    {
        get
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return val is null ? null : Guid.Parse(val);
        }
    }

    /// <summary>POST /api/v1/activation/verify — check code validity without activating</summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyCodeRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new VerifyActivationCodeQuery(request.Code), ct);
        return Ok(result);
    }

    /// <summary>POST /api/v1/activation/activate — activate code (requires auth)</summary>
    [HttpPost("activate")]
    [Authorize]
    public async Task<IActionResult> Activate([FromBody] ActivateCodeRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        var result = await mediator.Send(new ActivateCodeCommand(request.Code, userId), ct);
        if (!result.Success)
            return BadRequest(new { message = result.Message });
        return Ok(result);
    }

    /// <summary>GET /api/v1/activation/my-codes — list current user's activation codes</summary>
    [HttpGet("my-codes")]
    [Authorize]
    public async Task<IActionResult> MyCodes(CancellationToken ct)
    {
        var userId = CurrentUserId ?? throw new UnauthorizedAccessException();
        var codes = await mediator.Send(new GetMyActivationCodesQuery(userId), ct);
        return Ok(codes);
    }
}

public record VerifyCodeRequest(string Code);
public record ActivateCodeRequest(string Code);
