using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class ActivationCodeConfiguration : IEntityTypeConfiguration<ActivationCode>
{
    public void Configure(EntityTypeBuilder<ActivationCode> builder)
    {
        builder.ToTable("ActivationCodes");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.Code).HasMaxLength(20).IsRequired();
        builder.HasIndex(a => a.Code).IsUnique();
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(a => a.BookId);
        builder.HasIndex(a => a.OrderId);
        builder.HasIndex(a => a.UserId);
    }
}
