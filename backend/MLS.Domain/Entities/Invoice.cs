using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid    OrderId        { get; private set; }
    public string  InvoiceNumber  { get; private set; } = string.Empty;
    public DateTime IssuedAt      { get; private set; }

    // Buyer snapshot
    public string? BuyerName     { get; private set; }
    public string? BuyerEmail    { get; private set; }
    public string? BuyerPhone    { get; private set; }
    public string? BuyerAddress  { get; private set; }
    public string? BuyerTaxCode  { get; private set; }

    // Amounts
    public decimal TotalAmount    { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal FinalAmount    { get; private set; }
    public decimal VatAmount      { get; private set; }

    public string? Notes  { get; private set; }
    public string? PdfUrl { get; private set; }

    // Navigation
    public Order? Order { get; private set; }

    private Invoice() { }

    public static Invoice Create(
        Guid    orderId,
        string  invoiceNumber,
        decimal totalAmount,
        decimal finalAmount,
        decimal discountAmount = 0,
        decimal vatAmount = 0,
        string? buyerName = null,
        string? buyerEmail = null,
        string? buyerPhone = null,
        string? buyerAddress = null,
        string? buyerTaxCode = null,
        string? notes = null)
        => new Invoice
        {
            Id             = Guid.NewGuid(),
            OrderId        = orderId,
            InvoiceNumber  = invoiceNumber,
            IssuedAt       = DateTime.UtcNow,
            TotalAmount    = totalAmount,
            DiscountAmount = discountAmount,
            FinalAmount    = finalAmount,
            VatAmount      = vatAmount,
            BuyerName      = buyerName,
            BuyerEmail     = buyerEmail,
            BuyerPhone     = buyerPhone,
            BuyerAddress   = buyerAddress,
            BuyerTaxCode   = buyerTaxCode,
            Notes          = notes,
            CreatedAt      = DateTime.UtcNow
        };

    public void SetPdfUrl(string pdfUrl) => PdfUrl = pdfUrl;
}
