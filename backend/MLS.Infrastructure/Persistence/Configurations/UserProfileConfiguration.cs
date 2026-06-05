using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.UserId).IsRequired();
        builder.Property(p => p.FullName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.AvatarUrl).HasMaxLength(512);
        builder.Property(p => p.Gender).HasMaxLength(10);
        builder.Property(p => p.Address).HasMaxLength(500);
        builder.Property(p => p.CurrentLevel).HasMaxLength(50);
        builder.Property(p => p.Country).HasMaxLength(100);
        builder.Property(p => p.NativeLanguage).HasMaxLength(20);
    }
}
