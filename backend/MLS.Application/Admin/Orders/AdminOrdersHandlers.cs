using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Orders.Events;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Orders;

// ── DTOs ─────────────────────────────────────────────────────────────────────

public record AdminOrderListItemDto(
    Guid Id,
    string OrderCode,
    Guid UserId,
    string? UserName,
    string? UserEmail,
    string Status,
    string PaymentStatus,
    string PaymentMethod,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    string? VoucherCode,
    DateTime? PaidAt,
    DateTime CreatedAt,
    int ItemCount
);

public record AdminOrderItemDto(
    Guid  Id,
    Guid? BookId,
    string BookTitle,
    string BookType,
    int    Quantity,
    decimal UnitPrice,
    decimal Subtotal,
    // Phase 5
    string ItemType = "Book",
    Guid?  CourseId = null,
    string? CourseSlug = null
);

public record AdminOrderDetailDto(
    Guid Id,
    string OrderCode,
    Guid UserId,
    string? UserName,
    string? UserEmail,
    string Status,
    string PaymentStatus,
    string PaymentMethod,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    string? VoucherCode,
    string? PaymentNote,
    DateTime? PaidAt,
    DateTime CreatedAt,
    List<AdminOrderItemDto> Items
);

public record AdminOrderListResult(List<AdminOrderListItemDto> Items, int Total, int Page, int PageSize);

// ── Queries ───────────────────────────────────────────────────────────────────

public record GetAdminOrdersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null,
    string? PaymentMethod = null
) : IRequest<AdminOrderListResult>;

public record GetAdminOrderDetailQuery(Guid Id) : IRequest<AdminOrderDetailDto?>;

// ── Commands ──────────────────────────────────────────────────────────────────

public record AdminConfirmPaymentCommand(Guid OrderId, string? Note = null) : IRequest<bool>;
public record AdminUpdateOrderStatusCommand(Guid OrderId, string Status) : IRequest<bool>;
public record AdminCancelOrderCommand(Guid OrderId) : IRequest<bool>;

// ── Handlers ─────────────────────────────────────────────────────────────────

public class GetAdminOrdersHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminOrdersQuery, AdminOrderListResult>
{
    public async Task<AdminOrderListResult> Handle(GetAdminOrdersQuery q, CancellationToken ct)
    {
        var query = db.Orders
            .Include(o => o.Items)
            .Join(db.Users.Include(u => u.Profile),
                o => o.UserId, u => u.Id,
                (o, u) => new { Order = o, User = u })
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var term = q.Search.Trim().ToLower();
            query = query.Where(x => x.Order.OrderCode.ToLower().Contains(term)
                || x.User.Email.ToLower().Contains(term)
                || (x.User.Profile != null && x.User.Profile.FullName.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(q.Status) && Enum.TryParse<OrderStatus>(q.Status, true, out var status))
            query = query.Where(x => x.Order.Status == status);

        if (!string.IsNullOrWhiteSpace(q.PaymentMethod) && Enum.TryParse<PaymentMethod>(q.PaymentMethod, true, out var pm))
            query = query.Where(x => x.Order.PaymentMethod == pm);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.Order.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(x => new AdminOrderListItemDto(
                x.Order.Id, x.Order.OrderCode,
                x.Order.UserId, x.User.Profile != null ? x.User.Profile.FullName : x.User.Email, x.User.Email,
                x.Order.Status.ToString(), x.Order.PaymentStatus.ToString(), x.Order.PaymentMethod.ToString(),
                x.Order.TotalAmount, x.Order.DiscountAmount, x.Order.FinalAmount,
                x.Order.VoucherCode, x.Order.PaidAt, x.Order.CreatedAt,
                x.Order.Items.Count))
            .ToListAsync(ct);

        return new AdminOrderListResult(items, total, q.Page, q.PageSize);
    }
}

public class GetAdminOrderDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminOrderDetailQuery, AdminOrderDetailDto?>
{
    public async Task<AdminOrderDetailDto?> Handle(GetAdminOrderDetailQuery q, CancellationToken ct)
    {
        var result = await db.Orders
            .Include(o => o.Items)
            .Join(db.Users.Include(u => u.Profile), o => o.UserId, u => u.Id, (o, u) => new { Order = o, User = u })
            .FirstOrDefaultAsync(x => x.Order.Id == q.Id, ct);

        if (result is null) return null;
        var o = result.Order;
        var u = result.User;

        return new AdminOrderDetailDto(
            o.Id, o.OrderCode, o.UserId,
            u.Profile != null ? u.Profile.FullName : u.Email, u.Email,
            o.Status.ToString(), o.PaymentStatus.ToString(), o.PaymentMethod.ToString(),
            o.TotalAmount, o.DiscountAmount, o.FinalAmount,
            o.VoucherCode, o.PaymentNote, o.PaidAt, o.CreatedAt,
            o.Items.Select(i => new AdminOrderItemDto(
                i.Id, i.BookId, i.BookTitle, i.BookType, i.Quantity, i.UnitPrice, i.TotalPrice,
                i.ItemType.ToString(), i.CourseId, i.CourseSlug)).ToList());
    }
}

public class AdminConfirmPaymentHandler(IApplicationDbContext db, IMediator mediator)
    : IRequestHandler<AdminConfirmPaymentCommand, bool>
{
    public async Task<bool> Handle(AdminConfirmPaymentCommand cmd, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == cmd.OrderId, ct);

        if (order is null) return false;
        if (order.Status is not (OrderStatus.Pending or OrderStatus.WaitingPayment)) return false;

        order.MarkPaid(cmd.Note);
        await db.SaveChangesAsync(ct);

        var paidEvent = new OrderPaidEvent(
            OrderId:   order.Id,
            OrderCode: order.OrderCode,
            UserId:    order.UserId,
            Items: order.Items.Select(i => new OrderPaidItemInfo(
                i.Id, i.BookId, i.BookTitle, i.BookType, i.Quantity, i.UnitPrice,
                i.ItemType, i.CourseId)).ToList(),
            PaidAt: order.PaidAt!.Value);

        await mediator.Publish(paidEvent, ct);
        return true;
    }
}

public class AdminUpdateOrderStatusHandler(IApplicationDbContext db)
    : IRequestHandler<AdminUpdateOrderStatusCommand, bool>
{
    public async Task<bool> Handle(AdminUpdateOrderStatusCommand cmd, CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == cmd.OrderId, ct);
        if (order is null) return false;

        if (!Enum.TryParse<OrderStatus>(cmd.Status, true, out var newStatus))
            throw new ArgumentException($"Invalid status: {cmd.Status}");

        switch (newStatus)
        {
            case OrderStatus.Completed: order.Complete(); break;
            case OrderStatus.Cancelled: order.Cancel(); break;
            default: throw new InvalidOperationException($"Cannot transition to {newStatus} via this endpoint.");
        }

        await db.SaveChangesAsync(ct);
        return true;
    }
}

public class AdminCancelOrderHandler(IApplicationDbContext db)
    : IRequestHandler<AdminCancelOrderCommand, bool>
{
    public async Task<bool> Handle(AdminCancelOrderCommand cmd, CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == cmd.OrderId, ct);
        if (order is null) return false;
        order.Cancel();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
