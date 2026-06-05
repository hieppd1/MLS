using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Vouchers;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record VoucherDto(
    Guid Id,
    string Code,
    string? Description,
    string Type,
    decimal Value,
    decimal? MinOrderAmount,
    decimal? MaxDiscountAmount,
    int? UsageLimit,
    int UsageCount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    string Status,
    bool IsPublic,
    DateTime CreatedAt
);

public record VoucherListResult(List<VoucherDto> Items, int Total, int Page, int PageSize);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAdminVouchersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null
) : IRequest<VoucherListResult>;

public record GetAdminVoucherDetailQuery(Guid Id) : IRequest<VoucherDto?>;

public record ValidateVoucherQuery(string Code, decimal OrderAmount) : IRequest<ValidateVoucherResult>;
public record ValidateVoucherResult(bool Valid, decimal Discount, string? Message);

// ── Commands ──────────────────────────────────────────────────────────────────

public record CreateVoucherCommand(
    string Code,
    string Type,
    decimal Value,
    string? Description = null,
    decimal? MinOrderAmount = null,
    decimal? MaxDiscountAmount = null,
    int? UsageLimit = null,
    DateTime? StartsAt = null,
    DateTime? ExpiresAt = null,
    bool IsPublic = true
) : IRequest<Guid>;

public record UpdateVoucherCommand(
    Guid Id,
    string? Description,
    string Type,
    decimal Value,
    decimal? MinOrderAmount,
    decimal? MaxDiscountAmount,
    int? UsageLimit,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    bool IsPublic
) : IRequest<bool>;

public record DeleteVoucherCommand(Guid Id) : IRequest<bool>;
public record ToggleVoucherStatusCommand(Guid Id, bool Activate) : IRequest<bool>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class GetAdminVouchersHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminVouchersQuery, VoucherListResult>
{
    public async Task<VoucherListResult> Handle(GetAdminVouchersQuery q, CancellationToken ct)
    {
        var query = db.Vouchers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim().ToUpper();
            query = query.Where(v => v.Code.Contains(term) || (v.Description != null && v.Description.ToLower().Contains(q.Search.ToLower())));
        }

        if (!string.IsNullOrWhiteSpace(q.Status) && Enum.TryParse<VoucherStatus>(q.Status, true, out var status))
            query = query.Where(v => v.Status == status);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(v => new VoucherDto(
                v.Id, v.Code, v.Description,
                v.Type.ToString(), v.Value,
                v.MinOrderAmount, v.MaxDiscountAmount,
                v.UsageLimit, v.UsageCount,
                v.StartsAt, v.ExpiresAt,
                v.Status.ToString(), v.IsPublic, v.CreatedAt))
            .ToListAsync(ct);

        return new VoucherListResult(items, total, q.Page, q.PageSize);
    }
}

public class GetAdminVoucherDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminVoucherDetailQuery, VoucherDto?>
{
    public async Task<VoucherDto?> Handle(GetAdminVoucherDetailQuery q, CancellationToken ct)
    {
        var v = await db.Vouchers.FirstOrDefaultAsync(x => x.Id == q.Id, ct);
        if (v is null) return null;
        return new VoucherDto(v.Id, v.Code, v.Description, v.Type.ToString(), v.Value,
            v.MinOrderAmount, v.MaxDiscountAmount, v.UsageLimit, v.UsageCount,
            v.StartsAt, v.ExpiresAt, v.Status.ToString(), v.IsPublic, v.CreatedAt);
    }
}

public class ValidateVoucherHandler(IApplicationDbContext db)
    : IRequestHandler<ValidateVoucherQuery, ValidateVoucherResult>
{
    public async Task<ValidateVoucherResult> Handle(ValidateVoucherQuery q, CancellationToken ct)
    {
        var v = await db.Vouchers.FirstOrDefaultAsync(x => x.Code == q.Code.Trim().ToUpper(), ct);
        if (v is null) return new(false, 0, "Mã voucher không tồn tại.");
        if (!v.IsValid(q.OrderAmount)) return new(false, 0, "Mã voucher không hợp lệ hoặc đã hết hạn.");
        var discount = v.CalculateDiscount(q.OrderAmount);
        return new(true, discount, null);
    }
}

public class CreateVoucherHandler(IApplicationDbContext db)
    : IRequestHandler<CreateVoucherCommand, Guid>
{
    public async Task<Guid> Handle(CreateVoucherCommand cmd, CancellationToken ct)
    {
        var exists = await db.Vouchers.AnyAsync(v => v.Code == cmd.Code.Trim().ToUpper(), ct);
        if (exists) throw new InvalidOperationException($"Voucher code '{cmd.Code}' already exists.");

        if (!Enum.TryParse<VoucherType>(cmd.Type, true, out var vtype))
            throw new ArgumentException($"Invalid voucher type: {cmd.Type}");

        var voucher = Voucher.Create(cmd.Code, vtype, cmd.Value, cmd.Description,
            cmd.MinOrderAmount, cmd.MaxDiscountAmount, cmd.UsageLimit,
            cmd.StartsAt, cmd.ExpiresAt, cmd.IsPublic);

        db.Vouchers.Add(voucher);
        await db.SaveChangesAsync(ct);
        return voucher.Id;
    }
}

public class UpdateVoucherHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateVoucherCommand, bool>
{
    public async Task<bool> Handle(UpdateVoucherCommand cmd, CancellationToken ct)
    {
        var v = await db.Vouchers.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct);
        if (v is null) return false;

        if (!Enum.TryParse<VoucherType>(cmd.Type, true, out var vtype))
            throw new ArgumentException($"Invalid voucher type: {cmd.Type}");

        v.Update(cmd.Description, vtype, cmd.Value, cmd.MinOrderAmount,
            cmd.MaxDiscountAmount, cmd.UsageLimit, cmd.StartsAt, cmd.ExpiresAt, cmd.IsPublic);

        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class DeleteVoucherHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteVoucherCommand, bool>
{
    public async Task<bool> Handle(DeleteVoucherCommand cmd, CancellationToken ct)
    {
        var v = await db.Vouchers.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct);
        if (v is null) return false;
        db.Vouchers.Remove(v);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class ToggleVoucherStatusHandler(IApplicationDbContext db)
    : IRequestHandler<ToggleVoucherStatusCommand, bool>
{
    public async Task<bool> Handle(ToggleVoucherStatusCommand cmd, CancellationToken ct)
    {
        var v = await db.Vouchers.FirstOrDefaultAsync(x => x.Id == cmd.Id, ct);
        if (v is null) return false;
        if (cmd.Activate) v.Activate(); else v.Deactivate();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
