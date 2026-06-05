using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class PassageGroupConfiguration : IEntityTypeConfiguration<PassageGroup>
{
    public void Configure(EntityTypeBuilder<PassageGroup> builder)
    {
        builder.ToTable("PassageGroups");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.PassageType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.PassageText).HasColumnType("text");
        builder.Property(x => x.AudioUrl).HasColumnType("text");
        builder.Property(x => x.QuestionIds).HasColumnType("jsonb").HasDefaultValue("[]");
        builder.Property(x => x.AudioPlayLimit).HasDefaultValue(2);
        builder.Property(x => x.PreListenSeconds).HasDefaultValue(20);

        builder.HasIndex(x => x.QuizId);
        builder.HasIndex(x => new { x.QuizId, x.GroupIndex });

        builder.HasOne(x => x.Quiz)
            .WithMany()
            .HasForeignKey(x => x.QuizId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class VSTEPSessionConfiguration : IEntityTypeConfiguration<VSTEPSession>
{
    public void Configure(EntityTypeBuilder<VSTEPSession> builder)
    {
        builder.ToTable("VSTEPSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.TargetBand).HasMaxLength(10);
        builder.Property(x => x.CurrentPart).HasMaxLength(20).HasDefaultValue("Listening");
        builder.Property(x => x.PartState).HasColumnType("jsonb");
        builder.Property(x => x.AssignedBand).HasMaxLength(10);

        builder.Property(x => x.ListeningScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.ReadingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.WritingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.SpeakingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.OverallScore).HasColumnType("decimal(4,2)");

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.UserId, x.IsCompleted });
    }
}

public class VSTEPBandResultConfiguration : IEntityTypeConfiguration<VSTEPBandResult>
{
    public void Configure(EntityTypeBuilder<VSTEPBandResult> builder)
    {
        builder.ToTable("VSTEPBandResults");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.AssignedBand).HasMaxLength(10).IsRequired();
        builder.Property(x => x.ListeningScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.ReadingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.WritingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.SpeakingScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.OverallScore).HasColumnType("decimal(4,2)");
        builder.Property(x => x.SkillBreakdown).HasColumnType("jsonb");
        builder.Property(x => x.RecommendedCourses).HasColumnType("jsonb");

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.SessionId).IsUnique();

        builder.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
