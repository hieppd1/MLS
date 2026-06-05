using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.Orders.Queries;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record OrderItemDto(
    Guid?  BookId,
    string BookTitle,
    string BookType,
    string? BookSlug,
    string? CoverColor,
    string? CoverEmoji,
    string? CoverUrl,
    int     Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    // Phase 5
    string  ItemType   = "Book",
    Guid?   CourseId   = null,
    string? CourseSlug = null
);

public record OrderSummaryDto(
    Guid    Id,
    string  OrderCode,
    string  Status,
    string  PaymentStatus,
    string  PaymentMethod,
    decimal TotalAmount,
    decimal FinalAmount,
    int     ItemCount,
    DateTime CreatedAt,
    DateTime? PaidAt
);

public record ActivationCodeDto(
    Guid    Id,
    string  Code,
    Guid    BookId,
    string  Status,
    DateTime? ExpiresAt
);

public record OrderDetailDto(
    Guid    Id,
    string  OrderCode,
    string  Status,
    string  PaymentStatus,
    string  PaymentMethod,
    string? PaymentNote,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    string? VoucherCode,
    DateTime CreatedAt,
    DateTime? PaidAt,
    object? Shipping,
    List<OrderItemDto> Items,
    List<ActivationCodeDto>? ActivationCodes = null
);

public record PagedOrdersResult(List<OrderSummaryDto> Items, int Total, int Page, int PageSize);

// ── Get My Orders (paginated) ─────────────────────────────────────────────────

public record GetMyOrdersQuery(Guid UserId, int Page = 1, int PageSize = 10) : IRequest<PagedOrdersResult>;

public class GetMyOrdersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyOrdersQuery, PagedOrdersResult>
{
    public async Task<PagedOrdersResult> Handle(GetMyOrdersQuery request, CancellationToken ct)
    {
        var query = db.Orders
            .Where(o => o.UserId == request.UserId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.OrderCode,
                o.Status.ToString(),
                o.PaymentStatus.ToString(),
                o.PaymentMethod.ToString(),
                o.TotalAmount,
                o.FinalAmount,
                o.Items.Count,
                o.CreatedAt,
                o.PaidAt))
            .ToListAsync(ct);

        return new PagedOrdersResult(items, total, request.Page, request.PageSize);
    }
}

// ── Get Order By Id ───────────────────────────────────────────────────────────

public record GetOrderByIdQuery(Guid OrderId, Guid UserId) : IRequest<OrderDetailDto?>;

public class GetOrderByIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    public async Task<OrderDetailDto?> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, ct);

        if (order == null) return null;

        var items = order.Items.Select(i => new OrderItemDto(
            i.BookId, i.BookTitle, i.BookType, i.BookSlug,
            i.BookCoverColor, i.BookCoverEmoji, i.BookCoverUrl,
            i.Quantity, i.UnitPrice, i.TotalPrice,
            i.ItemType.ToString(), i.CourseId, i.CourseSlug)).ToList();

        var codes = await db.ActivationCodes
            .Where(c => c.OrderId == order.Id)
            .Select(c => new ActivationCodeDto(c.Id, c.Code, c.BookId, c.Status.ToString(), c.ExpiresAt))
            .ToListAsync(ct);

        return new OrderDetailDto(
            order.Id, order.OrderCode,
            order.Status.ToString(),
            order.PaymentStatus.ToString(),
            order.PaymentMethod.ToString(),
            order.PaymentNote,
            order.TotalAmount, order.DiscountAmount, order.FinalAmount,
            order.VoucherCode,
            order.CreatedAt, order.PaidAt,
            order.GetShipping(),
            items, codes);
    }
}

// ── Get Order By Code (for VNPay return URL polling) ─────────────────────────

public record GetOrderByCodeQuery(string OrderCode, Guid UserId) : IRequest<OrderDetailDto?>;

public class GetOrderByCodeQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetOrderByCodeQuery, OrderDetailDto?>
{
    public async Task<OrderDetailDto?> Handle(GetOrderByCodeQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderCode == request.OrderCode && o.UserId == request.UserId, ct);

        if (order == null) return null;

        var items = order.Items.Select(i => new OrderItemDto(
            i.BookId, i.BookTitle, i.BookType, i.BookSlug,
            i.BookCoverColor, i.BookCoverEmoji, i.BookCoverUrl,
            i.Quantity, i.UnitPrice, i.TotalPrice,
            i.ItemType.ToString(), i.CourseId, i.CourseSlug)).ToList();

        var codes = await db.ActivationCodes
            .Where(c => c.OrderId == order.Id)
            .Select(c => new ActivationCodeDto(c.Id, c.Code, c.BookId, c.Status.ToString(), c.ExpiresAt))
            .ToListAsync(ct);

        return new OrderDetailDto(
            order.Id, order.OrderCode,
            order.Status.ToString(),
            order.PaymentStatus.ToString(),
            order.PaymentMethod.ToString(),
            order.PaymentNote,
            order.TotalAmount, order.DiscountAmount, order.FinalAmount,
            order.VoucherCode,
            order.CreatedAt, order.PaidAt,
            order.GetShipping(),
            items, codes);
    }
}
