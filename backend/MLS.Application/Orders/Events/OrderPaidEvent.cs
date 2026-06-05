using MediatR;
using MLS.Domain.Entities;

namespace MLS.Application.Orders.Events;

public record OrderPaidItemInfo(
    Guid    OrderItemId,
    Guid?   BookId,
    string  BookTitle,
    string  BookType,    // "Ebook" | "Physical" | "Combo" | "Course"
    int     Quantity,
    decimal UnitPrice,
    OrderItemType ItemType = OrderItemType.Book,
    Guid?   CourseId = null);

public record OrderPaidEvent(
    Guid   OrderId,
    string OrderCode,
    Guid   UserId,
    List<OrderPaidItemInfo> Items,
    DateTime PaidAt) : INotification;
