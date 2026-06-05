using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum OrderStatus
{
    Pending, WaitingPayment, Paid, Processing, Completed, Cancelled, Failed
}

public enum PaymentStatus { Unpaid, Paid, Refunded }

public enum PaymentMethod { BankTransfer, VNPay, MoMo, QRBanking }

public class ShippingAddress
{
    public string Name    { get; set; } = string.Empty;
    public string Phone   { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Province { get; set; }
    public string? District { get; set; }
    public string? Ward     { get; set; }
    public string? Notes    { get; set; }
}

public class Order : BaseEntity
{
    public string        OrderCode      { get; private set; } = string.Empty;
    public Guid          UserId         { get; private set; }
    public OrderStatus   Status         { get; private set; } = OrderStatus.Pending;
    public decimal       TotalAmount    { get; private set; }
    public decimal       DiscountAmount { get; private set; }
    public decimal       FinalAmount    { get; private set; }
    public string?       VoucherCode    { get; private set; }
    public PaymentStatus PaymentStatus  { get; private set; } = PaymentStatus.Unpaid;
    public PaymentMethod PaymentMethod  { get; private set; } = PaymentMethod.BankTransfer;
    public string?       PaymentNote    { get; private set; }
    public DateTime?     PaidAt         { get; private set; }

    // Shipping (serialised as JSON column)
    public string? ShippingJson     { get; private set; }
    public string? ShippingStatus   { get; private set; }   // e.g. "Pending","InTransit","Delivered"
    public string? ShippingProvider { get; private set; }   // e.g. "ViettelPost"

    public ICollection<OrderItem> Items { get; private set; } = [];

    private Order() { }

    public static Order Create(
        Guid userId,
        decimal totalAmount,
        decimal discountAmount,
        PaymentMethod paymentMethod,
        string? voucherCode = null,
        ShippingAddress? shipping = null)
    {
        var final = totalAmount - discountAmount;
        return new Order
        {
            OrderCode      = GenerateOrderCode(),
            UserId         = userId,
            TotalAmount    = totalAmount,
            DiscountAmount = discountAmount,
            FinalAmount    = final < 0 ? 0 : final,
            VoucherCode    = voucherCode,
            PaymentMethod  = paymentMethod,
            Status         = OrderStatus.Pending,
            ShippingJson   = shipping == null ? null :
                System.Text.Json.JsonSerializer.Serialize(shipping)
        };
    }

    public void MarkPaid(string? gatewayNote = null)
    {
        Status        = OrderStatus.Paid;
        PaymentStatus = PaymentStatus.Paid;
        PaidAt        = DateTime.UtcNow;
        PaymentNote   = gatewayNote;
        SetUpdatedAt();
    }

    public void Cancel()
    {
        if (Status is OrderStatus.Paid or OrderStatus.Completed)
            throw new InvalidOperationException("Cannot cancel a paid/completed order.");
        Status = OrderStatus.Cancelled;
        SetUpdatedAt();
    }

    public void Complete()
    {
        Status = OrderStatus.Completed;
        SetUpdatedAt();
    }

    public void UpdateShippingStatus(string shippingStatus, string provider = "ViettelPost")
    {
        ShippingStatus   = shippingStatus;
        ShippingProvider = provider;
        SetUpdatedAt();
    }

    public ShippingAddress? GetShipping()
        => ShippingJson == null ? null
           : System.Text.Json.JsonSerializer.Deserialize<ShippingAddress>(ShippingJson);

    private static string GenerateOrderCode()
        => $"MLS{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}";
}
