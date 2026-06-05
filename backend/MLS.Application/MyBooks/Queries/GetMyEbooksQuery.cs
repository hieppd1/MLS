using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.MyBooks.Queries;

public record EbookDto(
    Guid   BookId,
    string Title,
    string Slug,
    string CoverColor,
    string CoverEmoji,
    string? CoverUrl,
    string? Author,
    int?   PageCount,
    decimal? FileSizeMb,
    string? SampleUrl,
    string? FileUrl,
    int    ProgressPct,
    DateTime? LastReadAt,
    DateTime  GrantedAt,
    DateTime? ExpiresAt,
    bool   IsExpired);

public record GetMyEbooksQuery(Guid UserId) : IRequest<List<EbookDto>>;

public class GetMyEbooksQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyEbooksQuery, List<EbookDto>>
{
    public async Task<List<EbookDto>> Handle(GetMyEbooksQuery request, CancellationToken ct)
    {
        return await db.EbookEntitlements
            .Where(e => e.UserId == request.UserId)
            .Join(db.Books,
                e => e.BookId,
                b => b.Id,
                (e, b) => new
                {
                    BookId     = b.Id,
                    b.Title,
                    b.Slug,
                    b.CoverColor,
                    b.CoverEmoji,
                    b.CoverUrl,
                    b.Author,
                    b.PageCount,
                    b.FileSizeMb,
                    b.SampleUrl,
                    b.FileUrl,
                    e.ProgressPct,
                    e.LastReadAt,
                    GrantedAt  = e.CreatedAt,
                    e.ExpiresAt,
                })
            .OrderByDescending(x => x.GrantedAt)
            .Select(x => new EbookDto(
                x.BookId, x.Title, x.Slug, x.CoverColor, x.CoverEmoji, x.CoverUrl,
                x.Author, x.PageCount, x.FileSizeMb, x.SampleUrl, x.FileUrl,
                x.ProgressPct, x.LastReadAt, x.GrantedAt, x.ExpiresAt,
                x.ExpiresAt != null && x.ExpiresAt < DateTime.UtcNow))
            .ToListAsync(ct);
    }
}
