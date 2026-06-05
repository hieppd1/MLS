using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class CourseTranslationConfiguration : IEntityTypeConfiguration<CourseTranslation>
{
    public void Configure(EntityTypeBuilder<CourseTranslation> builder)
    {
        builder.HasKey(ct => new { ct.CourseId, ct.Locale });
        builder.Property(ct => ct.Locale).HasMaxLength(5).IsRequired();
        builder.Property(ct => ct.Title).HasMaxLength(300);
        builder.Property(ct => ct.ShortDescription).HasColumnType("text");
        builder.Property(ct => ct.Description).HasColumnType("text");
        builder.Property(ct => ct.Outcomes).HasColumnType("text");
        builder.Property(ct => ct.Requirements).HasColumnType("text");
        builder.Property(ct => ct.TargetAudience).HasColumnType("text");

        builder.HasOne(ct => ct.Course)
            .WithMany()
            .HasForeignKey(ct => ct.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ct => ct.Locale);
    }
}

public class BookTranslationConfiguration : IEntityTypeConfiguration<BookTranslation>
{
    public void Configure(EntityTypeBuilder<BookTranslation> builder)
    {
        builder.HasKey(bt => new { bt.BookId, bt.Locale });
        builder.Property(bt => bt.Locale).HasMaxLength(5).IsRequired();
        builder.Property(bt => bt.Title).HasMaxLength(300);
        builder.Property(bt => bt.ShortDescription).HasColumnType("text");
        builder.Property(bt => bt.Description).HasColumnType("text");

        builder.HasOne(bt => bt.Book)
            .WithMany()
            .HasForeignKey(bt => bt.BookId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(bt => bt.Locale);
    }
}

public class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.HasKey(nt => new { nt.Key, nt.Locale });
        builder.Property(nt => nt.Key).HasMaxLength(100).IsRequired();
        builder.Property(nt => nt.Locale).HasMaxLength(5).IsRequired();
        builder.Property(nt => nt.Title).HasMaxLength(300).IsRequired();
        builder.Property(nt => nt.Body).HasColumnType("text").IsRequired();
    }
}
