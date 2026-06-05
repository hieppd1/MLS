using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class BookCategoryConfiguration : IEntityTypeConfiguration<BookCategory>
{
    public void Configure(EntityTypeBuilder<BookCategory> builder)
    {
        builder.ToTable("BookCategories");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(250);
        builder.Property(c => c.Description).HasMaxLength(1000);
        builder.HasIndex(c => c.Slug).IsUnique();

        builder.HasMany(c => c.Books)
            .WithOne(b => b.Category)
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> builder)
    {
        builder.ToTable("Books");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).ValueGeneratedNever();
        builder.Property(b => b.Title).IsRequired().HasMaxLength(300);
        builder.Property(b => b.Slug).IsRequired().HasMaxLength(350);
        builder.Property(b => b.Description).HasColumnType("text");
        builder.Property(b => b.ShortDescription).HasMaxLength(500);
        builder.Property(b => b.Author).HasMaxLength(200);
        builder.Property(b => b.Publisher).HasMaxLength(200);
        builder.Property(b => b.Isbn).HasMaxLength(50);
        builder.Property(b => b.CoverColor).HasMaxLength(20).HasDefaultValue("#1a3a5c");
        builder.Property(b => b.CoverEmoji).HasMaxLength(10).HasDefaultValue("📚");
        builder.Property(b => b.CoverUrl).HasMaxLength(500);
        builder.Property(b => b.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(b => b.Level).HasMaxLength(10);
        builder.Property(b => b.Tags).HasColumnType("text");
        builder.Property(b => b.Price).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(b => b.DiscountPrice).HasColumnType("decimal(18,2)");
        builder.Property(b => b.FileSizeMb).HasColumnType("decimal(10,2)");
        builder.Property(b => b.Rating).HasColumnType("decimal(3,2)").HasDefaultValue(0m);
        builder.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(b => b.FileUrl).HasMaxLength(500);
        builder.Property(b => b.SampleUrl).HasMaxLength(500);

        builder.HasIndex(b => b.Slug).IsUnique();
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.Type);
        builder.HasIndex(b => b.IsFeatured);

        builder.HasMany(b => b.Entitlements)
            .WithOne(e => e.Book)
            .HasForeignKey(e => e.BookId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class EbookEntitlementConfiguration : IEntityTypeConfiguration<EbookEntitlement>
{
    public void Configure(EntityTypeBuilder<EbookEntitlement> builder)
    {
        builder.ToTable("EbookEntitlements");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.Source).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(e => new { e.UserId, e.BookId }).IsUnique();
        builder.HasIndex(e => e.UserId);
    }
}
