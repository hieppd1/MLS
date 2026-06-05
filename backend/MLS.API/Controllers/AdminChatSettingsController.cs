using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/admin/chat-settings")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminChatSettingsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var dto = await mediator.Send(new GetChatSettingsQuery(), ct);
        return Ok(dto);
    }

    public record UpdateChatSettingsRequest(
        int? MaxGroupsPerUser,
        int? MaxMembersPerGroup,
        bool? AllowImageUpload,
        bool? AllowFileUpload,
        int? MaxImageSizeKb,
        int? MaxFileSizeKb,
        string? AllowedMimeTypes);

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateChatSettingsRequest body, CancellationToken ct)
    {
        await mediator.Send(new UpdateChatSettingsCommand(
            body.MaxGroupsPerUser, body.MaxMembersPerGroup,
            body.AllowImageUpload, body.AllowFileUpload,
            body.MaxImageSizeKb, body.MaxFileSizeKb,
            body.AllowedMimeTypes), ct);
        return NoContent();
    }
}

// Local handlers (kept in API file to avoid extra file)
public record ChatSettingsDto(
    int MaxGroupsPerUser, int MaxMembersPerGroup,
    bool AllowImageUpload, bool AllowFileUpload,
    int MaxImageSizeKb, int MaxFileSizeKb,
    string AllowedMimeTypes);

public record GetChatSettingsQuery : IRequest<ChatSettingsDto>;

public class GetChatSettingsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetChatSettingsQuery, ChatSettingsDto>
{
    public async Task<ChatSettingsDto> Handle(GetChatSettingsQuery req, CancellationToken ct)
    {
        var s = await db.ChatSettings.FirstOrDefaultAsync(ct);
        if (s is null)
        {
            s = ChatSettings.CreateDefault();
            db.ChatSettings.Add(s);
            await db.SaveChangesAsync(ct);
        }
        return new ChatSettingsDto(
            s.MaxGroupsPerUser, s.MaxMembersPerGroup,
            s.AllowImageUpload, s.AllowFileUpload,
            s.MaxImageSizeKb, s.MaxFileSizeKb,
            s.AllowedMimeTypes);
    }
}

public record UpdateChatSettingsCommand(
    int? MaxGroupsPerUser, int? MaxMembersPerGroup,
    bool? AllowImageUpload, bool? AllowFileUpload,
    int? MaxImageSizeKb, int? MaxFileSizeKb,
    string? AllowedMimeTypes) : IRequest;

public class UpdateChatSettingsCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateChatSettingsCommand>
{
    public async Task Handle(UpdateChatSettingsCommand req, CancellationToken ct)
    {
        var s = await db.ChatSettings.FirstOrDefaultAsync(ct);
        if (s is null)
        {
            s = ChatSettings.CreateDefault();
            db.ChatSettings.Add(s);
        }
        s.Update(
            req.MaxGroupsPerUser ?? s.MaxGroupsPerUser,
            req.MaxMembersPerGroup ?? s.MaxMembersPerGroup,
            req.AllowImageUpload ?? s.AllowImageUpload,
            req.AllowFileUpload ?? s.AllowFileUpload,
            req.MaxImageSizeKb ?? s.MaxImageSizeKb,
            req.MaxFileSizeKb ?? s.MaxFileSizeKb,
            req.AllowedMimeTypes ?? s.AllowedMimeTypes);
        await db.SaveChangesAsync(ct);
    }
}
