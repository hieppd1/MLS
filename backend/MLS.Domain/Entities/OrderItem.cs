using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum OrderItemType { Book, Course }

public class OrderItem : BaseEntity
{
    public Guid   OrderId      { get; private set; }
    // Nullable — null when ItemType == Course
    public Guid?  BookId       { get; private set; }
    public string BookTitle    { get; private set; } = string.Empty;
    public string BookType     { get; private set; } = string.Empty;   // snapshot
    public string? BookCoverColor { get; private set; }
    public string? BookCoverEmoji { get; private set; }
    public string? BookCoverUrl   { get; private set; }
    public string? BookSlug       { get; private set; }
    public int     Quantity    { get; private set; } = 1;
    public decimal UnitPrice   { get; private set; }
    public decimal TotalPrice  { get; private set; }

    // Phase 5: Course items
    public OrderItemType ItemType   { get; private set; } = OrderItemType.Book;
    public Guid?         CourseId   { get; private set; }
    public string?       CourseSlug { get; private set; }

    public Order? Order { get; private set; }

    private OrderItem() { }

    public static OrderItem Create(
        Guid orderId,
        Guid bookId,
        string bookTitle,
        string bookType,
        decimal unitPrice,
        int quantity,
        string? bookSlug = null,
        string? coverColor = null,
        string? coverEmoji = null,
        string? coverUrl = null)
        => new OrderItem
        {
            OrderId        = orderId,
            BookId         = bookId,
            BookTitle      = bookTitle,
            BookType       = bookType,
            UnitPrice      = unitPrice,
            Quantity       = quantity,
            TotalPrice     = unitPrice * quantity,
            BookSlug       = bookSlug,
            BookCoverColor = coverColor,
            BookCoverEmoji = coverEmoji,
            BookCoverUrl   = coverUrl,
            ItemType       = OrderItemType.Book
        };

    public static OrderItem CreateCourseItem(
        Guid orderId,
        Guid courseId,
        string courseTitle,
        string? courseSlug,
        decimal unitPrice,
        string? coverColor = null,
        string? coverEmoji = null,
        string? coverUrl = null)
        => new OrderItem
        {
            OrderId        = orderId,
            BookId         = null,
            BookTitle      = courseTitle,
            BookType       = "Course",
            UnitPrice      = unitPrice,
            Quantity       = 1,
            TotalPrice     = unitPrice,
            BookSlug       = null,
            BookCoverColor = coverColor,
            BookCoverEmoji = coverEmoji,
            BookCoverUrl   = coverUrl,
            ItemType       = OrderItemType.Course,
            CourseId       = courseId,
            CourseSlug     = courseSlug
        };
}
