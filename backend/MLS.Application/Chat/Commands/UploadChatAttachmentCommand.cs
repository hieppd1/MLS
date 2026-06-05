using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.Chat.Commands;

public record ChatUploadResultDto(
    string FileUrl, string FileName, string MimeType, long SizeBytes);

public record UploadChatAttachmentCommand(
    Guid UserId,
    Stream FileStream,
    string FileName,
    string ContentType,
    long SizeBytes,
    bool IsImage
) : IRequest<ChatUploadResultDto>;

public class UploadChatAttachmentCommandHandler(
    IApplicationDbContext db,
    IStorageService storage,
    ITenantContext tenant) : IRequestHandler<UploadChatAttachmentCommand, ChatUploadResultDto>
{
    private static readonly string[] ImageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    private static readonly string[] FileMimes  =
    [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv",
        "application/zip", "application/x-zip-compressed",
    ];

    public async Task<ChatUploadResultDto> Handle(UploadChatAttachmentCommand req, CancellationToken ct)
    {
        var settings = await db.ChatSettings.FirstOrDefaultAsync(ct)
            ?? ChatSettings.CreateDefault();

        if (req.IsImage)
        {
            if (!settings.AllowImageUpload)
                throw new InvalidOperationException("Upload ảnh đang bị tắt.");
            if (!ImageMimes.Contains(req.ContentType))
                throw new InvalidOperationException($"Loại ảnh không hỗ trợ: {req.ContentType}");
            if (req.SizeBytes > settings.MaxImageSizeKb * 1024L)
                throw new InvalidOperationException($"Ảnh vượt giới hạn {settings.MaxImageSizeKb} KB.");
        }
        else
        {
            if (!settings.AllowFileUpload)
                throw new InvalidOperationException("Upload tệp đang bị tắt.");
            if (!FileMimes.Contains(req.ContentType) && !ImageMimes.Contains(req.ContentType))
                throw new InvalidOperationException($"Loại tệp không hỗ trợ: {req.ContentType}");
            if (req.SizeBytes > settings.MaxFileSizeKb * 1024L)
                throw new InvalidOperationException($"Tệp vượt giới hạn {settings.MaxFileSizeKb} KB.");
        }

        var safeName = $"{Guid.NewGuid():N}{System.IO.Path.GetExtension(req.FileName)}";
        var folder = req.IsImage ? "chat/images" : "chat/files";
        var url = await storage.UploadAsync(
            tenant.TenantSlug, folder, safeName,
            req.FileStream, req.ContentType, ct);

        return new ChatUploadResultDto(url, req.FileName, req.ContentType, req.SizeBytes);
    }
}
