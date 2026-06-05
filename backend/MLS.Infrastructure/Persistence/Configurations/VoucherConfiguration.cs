using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class VoucherConfiguration : IEntityTypeConfiguration<Voucher>
{
    public void Configure(EntityTypeBuilder<Voucher> builder)
    {
        builder.ToTable("Vouchers");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();
        builder.Property(v => v.Code).HasMaxLength(50).IsRequired();
        builder.HasIndex(v => v.Code).IsUnique();
        builder.Property(v => v.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(v => v.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(v => v.Value).HasColumnType("numeric(18,2)");
        builder.Property(v => v.MinOrderAmount).HasColumnType("numeric(18,2)");
        builder.Property(v => v.MaxDiscountAmount).HasColumnType("numeric(18,2)");
        builder.Property(v => v.Description).HasMaxLength(500);
    }
}
