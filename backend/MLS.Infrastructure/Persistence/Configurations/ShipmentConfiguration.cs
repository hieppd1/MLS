using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();

        builder.Property(s => s.Provider).IsRequired().HasMaxLength(50);
        builder.Property(s => s.TrackingNumber).HasMaxLength(100);
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(s => s.ShippingFee).HasColumnType("decimal(18,2)");

        builder.Property(s => s.ReceiverName).IsRequired().HasMaxLength(255);
        builder.Property(s => s.ReceiverPhone).IsRequired().HasMaxLength(20);
        builder.Property(s => s.ReceiverAddress).IsRequired().HasColumnType("text");
        builder.Property(s => s.ProvinceCode).HasMaxLength(20);
        builder.Property(s => s.DistrictCode).HasMaxLength(20);
        builder.Property(s => s.WardCode).HasMaxLength(20);
        builder.Property(s => s.RawResponse).HasColumnType("text");

        builder.HasIndex(s => s.OrderId);
        builder.HasIndex(s => s.TrackingNumber);

        builder.HasOne(s => s.Order)
            .WithMany()
            .HasForeignKey(s => s.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.TrackingLogs)
            .WithOne(l => l.Shipment)
            .HasForeignKey(l => l.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ShipmentTrackingLogConfiguration : IEntityTypeConfiguration<ShipmentTrackingLog>
{
    public void Configure(EntityTypeBuilder<ShipmentTrackingLog> builder)
    {
        builder.ToTable("ShipmentTrackingLogs");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).ValueGeneratedNever();

        builder.Property(l => l.Status).IsRequired().HasMaxLength(50);
        builder.Property(l => l.Description).HasColumnType("text");
        builder.Property(l => l.RawData).HasColumnType("text");

        builder.HasIndex(l => l.ShipmentId);
    }
}
