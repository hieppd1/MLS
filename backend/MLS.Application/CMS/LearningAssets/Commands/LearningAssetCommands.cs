using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;

namespace MLS.Application.CMS.LearningAssets.Commands;

// ── Create LearningAsset ──────────────────────────────────────────────────────

public record CreateLearningAssetCommand(
    Guid SegmentId,
    string Type,
    string Title,
    string? Description,
    int StartTime,
    int? EndTime = null,
    string Metadata = "{}",
    bool IsPublic = true
) : IRequest<Guid>;

public class CreateLearningAssetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateLearningAssetCommand, Guid>
{
    public async Task<Guid> Handle(CreateLearningAssetCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<LearningAssetType>(request.Type, out var assetType))
            throw new DomainException($"Unknown asset type: '{request.Type}'. " +
                $"Valid values: {string.Join(", ", Enum.GetNames<LearningAssetType>())}");

        // Validate startTime is within the owning segment's time range
        var segment = await db.Segments.FindAsync([request.SegmentId], ct)
            ?? throw new NotFoundException(nameof(Segment), request.SegmentId);

        if (request.StartTime < segment.StartTime || request.StartTime > segment.EndTime)
            throw new DomainException(
                $"Asset startTime ({request.StartTime}s) must be within segment " +
                $"[{segment.StartTime}–{segment.EndTime}s].");

        if (request.EndTime.HasValue && request.EndTime.Value > segment.EndTime)
            throw new DomainException(
                $"Asset endTime ({request.EndTime}s) must not exceed segment endTime ({segment.EndTime}s).");

        var orderIndex = await db.LearningAssets
            .Where(a => a.SegmentId == request.SegmentId)
            .CountAsync(ct);

        var asset = LearningAsset.Create(
            request.SegmentId, assetType, request.Title, request.Description,
            request.StartTime, request.EndTime, orderIndex, request.Metadata, request.IsPublic);

        db.LearningAssets.Add(asset);
        await db.SaveChangesAsync(ct);
        return asset.Id;
    }
}

// ── Update LearningAsset ──────────────────────────────────────────────────────

public record UpdateLearningAssetCommand(
    Guid AssetId,
    string Title,
    string? Description,
    int StartTime,
    int? EndTime,
    string Metadata,
    bool IsPublic
) : IRequest;

public class UpdateLearningAssetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateLearningAssetCommand>
{
    public async Task Handle(UpdateLearningAssetCommand request, CancellationToken ct)
    {
        var asset = await db.LearningAssets
            .Include(a => a.Segment)
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, ct)
            ?? throw new NotFoundException(nameof(LearningAsset), request.AssetId);

        var segment = asset.Segment;

        if (request.StartTime < segment.StartTime || request.StartTime > segment.EndTime)
            throw new DomainException(
                $"Asset startTime ({request.StartTime}s) must be within segment " +
                $"[{segment.StartTime}–{segment.EndTime}s].");

        if (request.EndTime.HasValue && request.EndTime.Value > segment.EndTime)
            throw new DomainException(
                $"Asset endTime ({request.EndTime}s) must not exceed segment endTime ({segment.EndTime}s).");

        asset.Update(request.Title, request.Description, request.StartTime, request.EndTime,
            request.Metadata, request.IsPublic);
        await db.SaveChangesAsync(ct);
    }
}

// ── Delete LearningAsset ──────────────────────────────────────────────────────

public record DeleteLearningAssetCommand(Guid AssetId) : IRequest;

public class DeleteLearningAssetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteLearningAssetCommand>
{
    public async Task Handle(DeleteLearningAssetCommand request, CancellationToken ct)
    {
        var asset = await db.LearningAssets.FindAsync([request.AssetId], ct)
            ?? throw new NotFoundException(nameof(LearningAsset), request.AssetId);

        db.LearningAssets.Remove(asset);
        await db.SaveChangesAsync(ct);
    }
}

// ── Reorder LearningAssets ────────────────────────────────────────────────────

public record ReorderLearningAssetsCommand(Guid SegmentId, List<Guid> OrderedIds) : IRequest;

public class ReorderLearningAssetsCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ReorderLearningAssetsCommand>
{
    public async Task Handle(ReorderLearningAssetsCommand request, CancellationToken ct)
    {
        var assets = await db.LearningAssets
            .Where(a => a.SegmentId == request.SegmentId)
            .ToListAsync(ct);

        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            var asset = assets.FirstOrDefault(a => a.Id == request.OrderedIds[i]);
            asset?.SetOrder(i);
        }

        await db.SaveChangesAsync(ct);
    }
}

// ── Upload file for PPTBlock / FileAttachment ─────────────────────────────────

public record UploadAssetFileCommand(
    Guid AssetId,
    string OriginalFileName,
    long SizeBytes,
    Stream FileStream,
    string ContentType,
    string TenantSlug) : IRequest<string>; // returns relative file path

public class UploadAssetFileCommandHandler(
    IApplicationDbContext db,
    IStorageService storage)
    : IRequestHandler<UploadAssetFileCommand, string>
{
    private static readonly HashSet<string> AllowedTypes =
        new(StringComparer.OrdinalIgnoreCase) { "PPTBlock", "FileAttachment" };

    public async Task<string> Handle(UploadAssetFileCommand request, CancellationToken ct)
    {
        var asset = await db.LearningAssets.FindAsync([request.AssetId], ct)
            ?? throw new NotFoundException(nameof(LearningAsset), request.AssetId);

        if (!AllowedTypes.Contains(asset.Type.ToString()))
            throw new DomainException($"File upload is only supported for PPTBlock and FileAttachment assets.");

        var safeFileName = $"{asset.Id}{Path.GetExtension(request.OriginalFileName)}";
        var storedPath = await storage.UploadAsync(
            request.TenantSlug, "asset-files", safeFileName,
            request.FileStream, request.ContentType, ct);

        // Merge fileUrl into existing metadata JSON
        var meta = ParseMetadata(asset.Metadata);
        meta["fileUrl"] = storedPath;
        meta["fileName"] = request.OriginalFileName;
        meta["fileSize"] = request.SizeBytes;

        asset.Update(asset.Title, asset.Description, asset.StartTime, asset.EndTime,
            System.Text.Json.JsonSerializer.Serialize(meta), asset.IsPublic);

        await db.SaveChangesAsync(ct);
        return storedPath;
    }

    private static Dictionary<string, object?> ParseMetadata(string raw)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(raw)
                   ?? new Dictionary<string, object?>();
        }
        catch { return new Dictionary<string, object?>(); }
    }
}
