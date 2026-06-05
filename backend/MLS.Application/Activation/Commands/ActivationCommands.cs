using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Activation.Commands;

// ── Verify (unauthenticated check) ───────────────────────────────────────────

public record VerifyActivationCodeResult(
    bool    Valid,
    string? BookTitle,
    string? BookType,
    string? Message);

public record VerifyActivationCodeQuery(string Code) : IRequest<VerifyActivationCodeResult>;

public class VerifyActivationCodeQueryHandler(IApplicationDbContext db)
    : IRequestHandler<VerifyActivationCodeQuery, VerifyActivationCodeResult>
{
    public async Task<VerifyActivationCodeResult> Handle(
        VerifyActivationCodeQuery request, CancellationToken ct)
    {
        var normalised = request.Code.Trim().ToUpper();
        var code = await db.ActivationCodes
            .Include(a => a.Book)
            .FirstOrDefaultAsync(a => a.Code == normalised, ct);

        if (code is null)
            return new(false, null, null, "Mã kích hoạt không tồn tại.");
        if (code.Status == ActivationCodeStatus.Activated)
            return new(false, null, null, "Mã kích hoạt đã được sử dụng.");
        if (code.Status == ActivationCodeStatus.Blocked)
            return new(false, null, null, "Mã kích hoạt đã bị khoá.");
        if (code.ExpiresAt.HasValue && code.ExpiresAt < DateTime.UtcNow)
            return new(false, null, null, "Mã kích hoạt đã hết hạn.");

        return new(true, code.Book?.Title, code.Book?.Type.ToString(), null);
    }
}

// ── Activate ──────────────────────────────────────────────────────────────────

public record ActivateCodeResult(
    bool    Success,
    string? BookTitle,
    string? BookSlug,
    string? BookType,
    string? Message);

public record ActivateCodeCommand(string Code, Guid UserId) : IRequest<ActivateCodeResult>;

public class ActivateCodeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<ActivateCodeCommand, ActivateCodeResult>
{
    public async Task<ActivateCodeResult> Handle(ActivateCodeCommand request, CancellationToken ct)
    {
        var normalised = request.Code.Trim().ToUpper();
        var code = await db.ActivationCodes
            .Include(a => a.Book)
            .FirstOrDefaultAsync(a => a.Code == normalised, ct);

        if (code is null)
            return new(false, null, null, null, "Mã kích hoạt không tồn tại.");
        if (code.Status != ActivationCodeStatus.New)
            return new(false, null, null, null, "Mã kích hoạt không hợp lệ hoặc đã được sử dụng.");
        if (code.ExpiresAt.HasValue && code.ExpiresAt < DateTime.UtcNow)
            return new(false, null, null, null, "Mã kích hoạt đã hết hạn.");

        code.Activate(request.UserId);

        // Grant ebook entitlement for ebook/combo types
        if (code.Book?.Type is BookType.Ebook or BookType.Combo)
        {
            var exists = await db.EbookEntitlements
                .AnyAsync(e => e.UserId == request.UserId && e.BookId == code.BookId, ct);

            if (!exists)
            {
                var entitlement = EbookEntitlement.Create(
                    userId: request.UserId,
                    bookId: code.BookId,
                    source: EntitlementSource.Activation);
                db.EbookEntitlements.Add(entitlement);
            }
        }

        await db.SaveChangesAsync(ct);

        return new(true, code.Book?.Title, code.Book?.Slug, code.Book?.Type.ToString(), null);
    }
}

// ── My Activation Codes ───────────────────────────────────────────────────────

public record MyActivationCodeDto(
    string   Code,
    Guid     BookId,
    string   BookTitle,
    string   BookType,
    string   Status,
    DateTime? ActivatedAt,
    DateTime? ExpiresAt,
    DateTime  CreatedAt);

public record GetMyActivationCodesQuery(Guid UserId) : IRequest<List<MyActivationCodeDto>>;

public class GetMyActivationCodesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyActivationCodesQuery, List<MyActivationCodeDto>>
{
    public async Task<List<MyActivationCodeDto>> Handle(
        GetMyActivationCodesQuery request, CancellationToken ct)
    {
        return await db.ActivationCodes
            .Where(a => a.UserId == request.UserId)
            .Join(db.Books,
                a => a.BookId,
                b => b.Id,
                (a, b) => new MyActivationCodeDto(
                    a.Code,
                    b.Id,
                    b.Title,
                    b.Type.ToString(),
                    a.Status.ToString(),
                    a.ActivatedAt,
                    a.ExpiresAt,
                    a.CreatedAt))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }
}
