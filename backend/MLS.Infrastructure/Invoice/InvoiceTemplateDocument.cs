using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Invoice;

public class InvoiceTemplateDocument : IDocument
{
    private readonly Order            _order;
    private readonly Domain.Entities.Invoice _invoice;

    private static readonly string MLS_NAVY = "#0a2540";
    private static readonly string MLS_RED  = "#e5173f";

    public InvoiceTemplateDocument(Order order, Domain.Entities.Invoice invoice)
    {
        _order   = order;
        _invoice = invoice;
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title   = $"Hóa đơn {_invoice.InvoiceNumber}",
        Author  = "MLS EdTech Platform",
        Creator = "MLS"
    };

    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                // Logo / Brand
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("MLS")
                        .FontSize(28).Bold()
                        .FontColor(Color.FromHex(MLS_NAVY));
                    c.Item().Text("EdTech Platform")
                        .FontSize(9)
                        .FontColor(Colors.Grey.Medium);
                });

                // Invoice title
                row.ConstantItem(200).Column(c =>
                {
                    c.Item().AlignRight().Text("HÓA ĐƠN")
                        .FontSize(22).Bold()
                        .FontColor(Color.FromHex(MLS_RED));
                    c.Item().AlignRight().Text($"#{_invoice.InvoiceNumber}")
                        .FontSize(11)
                        .FontColor(Colors.Grey.Darken2);
                    c.Item().AlignRight().Text($"Ngày: {_invoice.IssuedAt.ToLocalTime():dd/MM/yyyy}")
                        .FontSize(9)
                        .FontColor(Colors.Grey.Medium);
                });
            });

            col.Item().PaddingTop(8).LineHorizontal(2).LineColor(Color.FromHex(MLS_RED));
        });
    }

    void ComposeContent(IContainer container)
    {
        container.PaddingTop(16).Column(col =>
        {
            // Buyer info + Order info side by side
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("THÔNG TIN NGƯỜI MUA").Bold().FontSize(9)
                        .FontColor(Colors.Grey.Darken2);
                    c.Item().PaddingTop(4).Text(_invoice.BuyerName ?? "—").Bold();
                    c.Item().Text(_invoice.BuyerEmail ?? "—").FontColor(Colors.Grey.Darken1);
                    if (!string.IsNullOrWhiteSpace(_invoice.BuyerPhone))
                        c.Item().Text(_invoice.BuyerPhone).FontColor(Colors.Grey.Darken1);
                    if (!string.IsNullOrWhiteSpace(_invoice.BuyerAddress))
                        c.Item().Text(_invoice.BuyerAddress).FontColor(Colors.Grey.Darken1);
                    if (!string.IsNullOrWhiteSpace(_invoice.BuyerTaxCode))
                        c.Item().Text($"MST: {_invoice.BuyerTaxCode}").FontColor(Colors.Grey.Darken1);
                });

                row.ConstantItem(180).Column(c =>
                {
                    c.Item().Text("CHI TIẾT ĐƠN HÀNG").Bold().FontSize(9)
                        .FontColor(Colors.Grey.Darken2);
                    c.Item().PaddingTop(4)
                        .Text($"Mã đơn: {_order.OrderCode}").Bold();
                    c.Item().Text($"Phương thức TT: {_order.PaymentMethod}")
                        .FontColor(Colors.Grey.Darken1);
                    if (_order.PaidAt.HasValue)
                        c.Item().Text($"Thanh toán: {_order.PaidAt.Value.ToLocalTime():dd/MM/yyyy HH:mm}")
                            .FontColor(Colors.Grey.Darken1);
                });
            });

            col.Item().PaddingTop(20).Element(ComposeItemsTable);

            col.Item().PaddingTop(16).AlignRight().Column(c =>
            {
                c.Item().Row(r =>
                {
                    r.ConstantItem(200);
                    r.RelativeItem().Column(inner =>
                    {
                        inner.Item().Row(row =>
                        {
                            row.RelativeItem().Text("Tạm tính:");
                            row.ConstantItem(120).AlignRight()
                                .Text(FormatVnd(_invoice.TotalAmount));
                        });

                        if (_invoice.DiscountAmount > 0)
                        {
                            inner.Item().Row(row =>
                            {
                                row.RelativeItem().Text("Giảm giá:")
                                    .FontColor(Colors.Green.Darken2);
                                row.ConstantItem(120).AlignRight()
                                    .Text($"−{FormatVnd(_invoice.DiscountAmount)}")
                                    .FontColor(Colors.Green.Darken2);
                            });
                        }

                        inner.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        inner.Item().PaddingTop(4).Row(row =>
                        {
                            row.RelativeItem().Text("TỔNG CỘNG:").Bold().FontSize(12);
                            row.ConstantItem(120).AlignRight()
                                .Text(FormatVnd(_invoice.FinalAmount))
                                .Bold().FontSize(12)
                                .FontColor(Color.FromHex(MLS_RED));
                        });
                    });
                });
            });

            if (!string.IsNullOrWhiteSpace(_invoice.Notes))
            {
                col.Item().PaddingTop(16).Column(c =>
                {
                    c.Item().Text("Ghi chú:").Bold().FontSize(9).FontColor(Colors.Grey.Darken2);
                    c.Item().Text(_invoice.Notes).FontColor(Colors.Grey.Darken1);
                });
            }
        });
    }

    void ComposeItemsTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(cols =>
            {
                cols.ConstantColumn(28);  // #
                cols.RelativeColumn(4);   // Tên sản phẩm
                cols.RelativeColumn(1);   // Loại
                cols.ConstantColumn(40);  // SL
                cols.ConstantColumn(90);  // Đơn giá
                cols.ConstantColumn(90);  // Thành tiền
            });

            // Header row
            table.Header(header =>
            {
                void HeaderCell(string text) =>
                    header.Cell().Background(Color.FromHex(MLS_NAVY)).Padding(5)
                        .Text(text).Bold().FontColor(Colors.White).FontSize(9);

                HeaderCell("#");
                HeaderCell("Sản phẩm");
                HeaderCell("Loại");
                HeaderCell("SL");
                HeaderCell("Đơn giá");
                HeaderCell("Thành tiền");
            });

            int idx = 1;
            foreach (var item in _order.Items)
            {
                var isEven = idx % 2 == 0;
                var bg = isEven ? Colors.Grey.Lighten5 : Colors.White;

                table.Cell().Background(bg).Padding(5).AlignCenter().Text(idx.ToString());
                table.Cell().Background(bg).Padding(5).Text(item.BookTitle);
                table.Cell().Background(bg).Padding(5).Text(item.BookType);
                table.Cell().Background(bg).Padding(5).AlignCenter().Text(item.Quantity.ToString());
                table.Cell().Background(bg).Padding(5).AlignRight().Text(FormatVnd(item.UnitPrice));
                table.Cell().Background(bg).Padding(5).AlignRight().Text(FormatVnd(item.TotalPrice)).Bold();

                idx++;
            }
        });
    }

    void ComposeFooter(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Text("MLS EdTech Platform · support@mls.vn")
                .FontSize(8).FontColor(Colors.Grey.Medium);
            row.ConstantItem(100).AlignRight()
                .Text(text =>
                {
                    text.Span("Trang ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
        });
    }

    private static string FormatVnd(decimal amount)
        => $"{amount:N0} đ";

    /// <summary>Convenience factory: set license, create doc, generate bytes.</summary>
    public static byte[] Render(Order order, Domain.Entities.Invoice invoice)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        var doc = new InvoiceTemplateDocument(order, invoice);
        return doc.GeneratePdf();
    }
}
