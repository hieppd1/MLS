using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();
        builder.Property(o => o.OrderCode).IsRequired().HasMaxLength(40);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(o => o.PaymentStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.PaymentMethod).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.PaymentNote).HasMaxLength(500);
        builder.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(o => o.DiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(o => o.FinalAmount).HasColumnType("decimal(18,2)");
        builder.Property(o => o.VoucherCode).HasMaxLength(50);
        builder.Property(o => o.ShippingJson).HasColumnType("text");

        builder.HasIndex(o => o.OrderCode).IsUnique();
        builder.HasIndex(o => o.UserId);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.BookId).IsRequired(false);
        builder.Property(i => i.BookTitle).IsRequired().HasMaxLength(500);
        builder.Property(i => i.BookType).IsRequired().HasMaxLength(30);
        builder.Property(i => i.BookSlug).HasMaxLength(350);
        builder.Property(i => i.BookCoverColor).HasMaxLength(20);
        builder.Property(i => i.BookCoverEmoji).HasMaxLength(10);
        builder.Property(i => i.BookCoverUrl).HasMaxLength(1000);
        builder.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(i => i.TotalPrice).HasColumnType("decimal(18,2)");

        // Phase 5
        builder.Property(i => i.ItemType).HasConversion<string>().HasMaxLength(20).HasDefaultValue(OrderItemType.Book);
        builder.Property(i => i.CourseId).IsRequired(false);
        builder.Property(i => i.CourseSlug).HasMaxLength(500);

        builder.HasIndex(i => i.OrderId);
        builder.HasIndex(i => i.CourseId).HasFilter("\"CourseId\" IS NOT NULL");
    }
}
