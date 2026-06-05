using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.CMS.LearningAssets.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record LearningAssetDetailDto(
    Guid Id,
    Guid SegmentId,
    string Type,
    string Title,
    string? Description,
    int StartTime,
    int OrderIndex,
    string Metadata,
    bool IsPublic
);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetLearningAssetDetailQuery(Guid AssetId) : IRequest<LearningAssetDetailDto?>;

public class GetLearningAssetDetailQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLearningAssetDetailQuery, LearningAssetDetailDto?>
{
    public async Task<LearningAssetDetailDto?> Handle(GetLearningAssetDetailQuery request, CancellationToken ct)
    {
        var asset = await db.LearningAssets
            .FirstOrDefaultAsync(a => a.Id == request.AssetId, ct);

        if (asset == null) return null;

        return new LearningAssetDetailDto(
            asset.Id, asset.SegmentId, asset.Type.ToString(), asset.Title,
            asset.Description, asset.StartTime, asset.OrderIndex, asset.Metadata, asset.IsPublic);
    }
}

public record GetLearningAssetsBySegmentQuery(Guid SegmentId) : IRequest<List<LearningAssetDetailDto>>;

public class GetLearningAssetsBySegmentQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetLearningAssetsBySegmentQuery, List<LearningAssetDetailDto>>
{
    public async Task<List<LearningAssetDetailDto>> Handle(GetLearningAssetsBySegmentQuery request, CancellationToken ct)
    {
        var assets = await db.LearningAssets
            .Where(a => a.SegmentId == request.SegmentId)
            .OrderBy(a => a.OrderIndex)
            .ToListAsync(ct);

        return assets.Select(a => new LearningAssetDetailDto(
            a.Id, a.SegmentId, a.Type.ToString(), a.Title,
            a.Description, a.StartTime, a.OrderIndex, a.Metadata, a.IsPublic
        )).ToList();
    }
}
