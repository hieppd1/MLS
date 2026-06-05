using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Resources;
using MLS.Application.Chat.Commands;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/chat/uploads")]
[Authorize]
public class ChatUploadController(IMediator mediator, IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("image")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50MB ceiling; ChatSettings re-validates
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken ct = default)
        => await UploadCore(file, isImage: true, ct);

    [HttpPost("file")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> UploadFile(IFormFile file, CancellationToken ct = default)
        => await UploadCore(file, isImage: false, ct);

    private async Task<IActionResult> UploadCore(IFormFile file, bool isImage, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return UnprocessableEntity(new { message = loc["FileEmpty"].Value });
        try
        {
            await using var stream = file.OpenReadStream();
            var result = await mediator.Send(new UploadChatAttachmentCommand(
                CurrentUserId, stream, file.FileName, file.ContentType, file.Length, isImage), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return UnprocessableEntity(new { message = ex.Message }); }
    }
}
