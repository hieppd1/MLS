using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class OtpVerificationConfiguration : IEntityTypeConfiguration<OtpVerification>
{
    public void Configure(EntityTypeBuilder<OtpVerification> builder)
    {
        builder.ToTable("OtpVerifications");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();

        builder.Property(o => o.Target).IsRequired().HasMaxLength(255);
        builder.Property(o => o.CodeHash).IsRequired().HasMaxLength(128);
        builder.Property(o => o.Type).HasConversion<string>().HasMaxLength(30);

        builder.HasIndex(o => new { o.Target, o.Type });
    }
}
