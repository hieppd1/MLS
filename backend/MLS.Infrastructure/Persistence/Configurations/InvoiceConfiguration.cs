using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MLS.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<MLS.Domain.Entities.Invoice>
{
    public void Configure(EntityTypeBuilder<MLS.Domain.Entities.Invoice> builder)
    {
        builder.ToTable("Invoices");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.InvoiceNumber).IsRequired().HasMaxLength(30);
        builder.Property(i => i.BuyerName).HasMaxLength(200);
        builder.Property(i => i.BuyerEmail).HasMaxLength(200);
        builder.Property(i => i.BuyerPhone).HasMaxLength(20);
        builder.Property(i => i.BuyerAddress).HasMaxLength(500);
        builder.Property(i => i.BuyerTaxCode).HasMaxLength(50);
        builder.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(i => i.DiscountAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(i => i.FinalAmount).HasColumnType("decimal(18,2)");
        builder.Property(i => i.VatAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(i => i.Notes).HasColumnType("text");
        builder.Property(i => i.PdfUrl).HasMaxLength(1000);

        builder.HasIndex(i => i.OrderId).IsUnique();
        builder.HasIndex(i => i.InvoiceNumber).IsUnique();

        builder.HasOne(i => i.Order)
            .WithOne()
            .HasForeignKey<MLS.Domain.Entities.Invoice>(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
