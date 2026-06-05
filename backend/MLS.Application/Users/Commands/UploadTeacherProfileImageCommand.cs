using MediatR;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Interfaces;

namespace MLS.Application.Users.Commands;

/// <summary>
/// Uploads an image (avatar or cover) for a teacher's public profile.
/// Returns the relative storage URL — the caller is responsible for persisting it.
/// </summary>
public record UploadTeacherProfileImageCommand(
    Guid UserId,
    string ImageType,   // "avatar" | "cover"
    Stream FileStream,
    string FileName,
    string ContentType) : IRequest<string>;

public class UploadTeacherProfileImageCommandHandler(
    IStorageService storage,
    ITenantContext tenantContext) : IRequestHandler<UploadTeacherProfileImageCommand, string>
{
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

    public async Task<string> Handle(UploadTeacherProfileImageCommand request, CancellationToken ct)
    {
        if (!AllowedTypes.Contains(request.ContentType))
            throw new DomainException("Image must be JPEG, PNG, or WebP.");

        if (request.FileStream.Length > MaxBytes)
            throw new DomainException("Image must not exceed 5 MB.");

        var folder = request.ImageType == "cover" ? "teacher-covers" : "teacher-avatars";
        var ext = Path.GetExtension(request.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";
        var fileName = $"{request.UserId}-{DateTime.UtcNow.Ticks}{ext}";

        return await storage.UploadAsync(
            tenantContext.TenantSlug,
            folder,
            fileName,
            request.FileStream,
            request.ContentType,
            ct);
    }
}
