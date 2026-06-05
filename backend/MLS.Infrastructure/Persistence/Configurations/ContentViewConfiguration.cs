using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class ContentViewConfiguration : IEntityTypeConfiguration<ContentView>
{
    public void Configure(EntityTypeBuilder<ContentView> builder)
    {
        builder.ToTable("ContentViews");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();
        builder.Property(v => v.ContentType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(v => v.ContentId).IsRequired();
        builder.Property(v => v.ViewedAt).IsRequired();

        builder.HasIndex(v => new { v.ContentType, v.ContentId, v.ViewedAt });
        builder.HasIndex(v => new { v.UserId, v.ContentType, v.ContentId });
    }
}
