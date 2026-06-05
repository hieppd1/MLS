using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Interfaces;

namespace MLS.Application.Users.Commands;

// ── Command ───────────────────────────────────────────────────────────────────
public record UploadAvatarCommand(Guid UserId, Stream FileStream, string FileName, string ContentType)
    : IRequest<string>;

// ── Handler ───────────────────────────────────────────────────────────────────
public class UploadAvatarCommandHandler(
    IApplicationDbContext db,
    IStorageService storage,
    ITenantContext tenantContext) : IRequestHandler<UploadAvatarCommand, string>
{
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

    public async Task<string> Handle(UploadAvatarCommand request, CancellationToken cancellationToken)
    {
        if (!AllowedContentTypes.Contains(request.ContentType))
            throw new DomainException("Avatar must be a JPEG, PNG, or WebP image.");

        if (request.FileStream.Length > MaxFileSizeBytes)
            throw new DomainException("Avatar file size must not exceed 5MB.");

        var profile = await db.UserProfiles
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken)
            ?? throw new NotFoundException("UserProfile", request.UserId);

        var ext = Path.GetExtension(request.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";
        var safeFileName = $"{request.UserId}{ext}";

        var relativePath = await storage.UploadAsync(
            tenantContext.TenantSlug,
            "avatars",
            safeFileName,
            request.FileStream,
            request.ContentType,
            cancellationToken);

        profile.SetAvatarUrl(relativePath);
        await db.SaveChangesAsync(cancellationToken);

        return relativePath;
    }
}
