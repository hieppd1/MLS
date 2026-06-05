using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Orders.Commands;

// ── Request DTO ───────────────────────────────────────────────────────────────

public record CheckoutItemDto(
    Guid?   BookId,
    string  Title,
    string  Type,
    decimal UnitPrice,
    int     Quantity,
    string? Slug,
    string? CoverColor,
    string? CoverEmoji,
    string? CoverUrl,
    // Phase 5: course items
    string  ItemType = "Book",   // "Book" | "Course"
    Guid?   CourseId = null
);

public record CreateCheckoutCommand(
    Guid UserId,
    List<CheckoutItemDto> Items,
    string PaymentMethod,          // BankTransfer | VNPay | MoMo
    string? ShippingName,
    string? ShippingPhone,
    string? ShippingAddress,
    string? ShippingProvince,
    string? ShippingDistrict,
    string? ShippingWard,
    string? Notes,
    string? VoucherCode,
    string? GatewayIpnBaseUrl = null,
    string? ClientIpAddress   = null,
    string? TenantSlug        = null
) : IRequest<CreateCheckoutResult>;

public record CreateCheckoutResult(
    Guid OrderId,
    string OrderCode,
    decimal TotalAmount,
    decimal FinalAmount,
    string PaymentMethod,
    string? PaymentUrl   // non-null for VNPay/MoMo
);

// ── Handler ───────────────────────────────────────────────────────────────────

public class CreateCheckoutCommandHandler(
    IApplicationDbContext db,
    IMomoPaymentService? momoService = null,
    IVnPayService? vnPayService = null)
    : IRequestHandler<CreateCheckoutCommand, CreateCheckoutResult>
{
    public async Task<CreateCheckoutResult> Handle(
        CreateCheckoutCommand request, CancellationToken ct)
    {
        if (request.Items is null || request.Items.Count == 0)
            throw new ArgumentException("Cart is empty.");

        // Separate book items from course items
        var bookItems   = request.Items.Where(i => i.ItemType != "Course").ToList();
        var courseItems = request.Items.Where(i => i.ItemType == "Course").ToList();

        // ── Validate book items ────────────────────────────────────────────
        var bookIds     = bookItems.Where(i => i.BookId.HasValue).Select(i => i.BookId!.Value).ToList();
        var books       = bookIds.Count > 0
            ? await db.Books
                .Where(b => bookIds.Contains(b.Id) && b.Status == BookStatus.Published)
                .ToListAsync(ct)
            : new List<Book>();

        if (books.Count != bookIds.Count)
            throw new InvalidOperationException("One or more books are not available.");

        // ── Validate course items ──────────────────────────────────────────
        var courseIdList = courseItems.Where(i => i.CourseId.HasValue).Select(i => i.CourseId!.Value).ToList();
        var courses = courseIdList.Count > 0
            ? await db.Courses
                .Where(c => courseIdList.Contains(c.Id) && c.Status == CourseStatus.Published)
                .ToListAsync(ct)
            : new List<Course>();

        if (courses.Count != courseIdList.Count)
            throw new InvalidOperationException("One or more courses are not available.");

        // Check already enrolled
        if (courses.Count > 0)
        {
            var alreadyEnrolled = await db.CourseEnrollments
                .Where(e => e.UserId == request.UserId && courseIdList.Contains(e.CourseId))
                .Select(e => e.CourseId)
                .ToListAsync(ct);
            if (alreadyEnrolled.Count > 0)
                throw new InvalidOperationException("You are already enrolled in one or more selected courses.");
        }

        // ── Calculate totals (server-side prices, ignore client values) ────
        decimal totalAmount = 0;

        var validatedBookItems   = new List<(CheckoutItemDto req, Book book)>();
        var validatedCourseItems = new List<(CheckoutItemDto req, Course course)>();

        foreach (var item in bookItems)
        {
            var book  = books.First(b => b.Id == item.BookId);
            var price = book.DiscountPrice ?? book.Price;
            totalAmount += price * item.Quantity;
            validatedBookItems.Add((item, book));
        }

        foreach (var item in courseItems)
        {
            var course = courses.First(c => c.Id == item.CourseId);
            if (course.IsFree)
                throw new InvalidOperationException($"Course '{course.Title}' is free — use free enrollment.");
            var price = course.DiscountPrice ?? course.Price;
            totalAmount += price;
            validatedCourseItems.Add((item, course));
        }

        // Determine payment method
        var paymentMethod = request.PaymentMethod switch
        {
            "VNPay"       => PaymentMethod.VNPay,
            "MoMo"        => PaymentMethod.MoMo,
            "QRBanking"   => PaymentMethod.QRBanking,
            _             => PaymentMethod.BankTransfer
        };

        // Build shipping info if needed
        bool hasPhysical = validatedBookItems.Any(x =>
            x.book.Type is BookType.Physical or BookType.Combo);

        ShippingAddress? shipping = null;
        if (hasPhysical && !string.IsNullOrWhiteSpace(request.ShippingName))
        {
            shipping = new ShippingAddress
            {
                Name     = request.ShippingName,
                Phone    = request.ShippingPhone ?? string.Empty,
                Address  = request.ShippingAddress ?? string.Empty,
                Province = request.ShippingProvince,
                District = request.ShippingDistrict,
                Ward     = request.ShippingWard,
                Notes    = request.Notes
            };
        }

        // Create order
        var order = Order.Create(
            userId:         request.UserId,
            totalAmount:    totalAmount,
            discountAmount: 0,          // voucher support in Phase 1.2
            paymentMethod:  paymentMethod,
            voucherCode:    request.VoucherCode,
            shipping:       shipping);

        db.Orders.Add(order);

        // Create book order items
        foreach (var (item, book) in validatedBookItems)
        {
            var price  = book.DiscountPrice ?? book.Price;
            var oi     = OrderItem.Create(
                orderId:    order.Id,
                bookId:     book.Id,
                bookTitle:  book.Title,
                bookType:   book.Type.ToString(),
                unitPrice:  price,
                quantity:   item.Quantity,
                bookSlug:   book.Slug,
                coverColor: book.CoverColor,
                coverEmoji: book.CoverEmoji,
                coverUrl:   book.CoverUrl);
            db.OrderItems.Add(oi);
        }

        // Create course order items
        foreach (var (item, course) in validatedCourseItems)
        {
            var price = course.DiscountPrice ?? course.Price;
            var oi    = OrderItem.CreateCourseItem(
                orderId:     order.Id,
                courseId:    course.Id,
                courseTitle: course.Title,
                courseSlug:  course.Slug,
                unitPrice:   price,
                coverColor:  null,
                coverEmoji:  "🎓",
                coverUrl:    course.ThumbnailUrl);
            db.OrderItems.Add(oi);
        }

        await db.SaveChangesAsync(ct);

        // Build payment gateway URL if applicable
        string? paymentUrl = null;

        if (paymentMethod == PaymentMethod.MoMo && momoService is not null)
        {
            var ipnBase    = request.GatewayIpnBaseUrl ?? "https://yourdomain.com";
            var momoResult = await momoService.CreatePaymentAsync(new MomoPaymentRequest(
                OrderId:     order.OrderCode,
                RequestId:   Guid.NewGuid().ToString("N"),
                Amount:      (long)order.FinalAmount,
                OrderInfo:   $"Thanh toán đơn hàng {order.OrderCode}",
                RedirectUrl: $"{ipnBase}/api/v1/payment/momo/return",
                IpnUrl:      $"{ipnBase}/api/v1/payment/momo/ipn"
            ), ct);

            if (momoResult.Success) paymentUrl = momoResult.PayUrl;
        }

        if (paymentMethod == PaymentMethod.VNPay && vnPayService is not null)
        {
            var baseUrl = request.GatewayIpnBaseUrl ?? "https://yourdomain.com";
            paymentUrl  = vnPayService.BuildPaymentUrl(new VnPayPaymentRequest(
                OrderCode: order.OrderCode,
                Amount:    (long)order.FinalAmount,
                OrderInfo: $"Thanh toan don hang {order.OrderCode}",
                ReturnUrl: string.IsNullOrEmpty(request.TenantSlug)
                    ? $"{baseUrl}/api/v1/payment/vnpay/return"
                    : $"{baseUrl}/api/v1/payment/vnpay/return?tenant={request.TenantSlug}",
                IpAddr:    request.ClientIpAddress ?? "127.0.0.1"
            ));
        }

        return new CreateCheckoutResult(
            order.Id,
            order.OrderCode,
            order.TotalAmount,
            order.FinalAmount,
            order.PaymentMethod.ToString(),
            paymentUrl);
    }
}
