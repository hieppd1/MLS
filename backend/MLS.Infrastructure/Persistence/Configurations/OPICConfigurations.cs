using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class OPICTopicSurveyConfiguration : IEntityTypeConfiguration<OPICTopicSurvey>
{
    public void Configure(EntityTypeBuilder<OPICTopicSurvey> builder)
    {
        builder.ToTable("OPICTopicSurveys");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("vi");
        builder.Property(x => x.SelectedTopics).HasColumnType("jsonb").HasDefaultValue("[]");
        builder.Property(x => x.TargetLevel).HasMaxLength(10);
        builder.HasIndex(x => x.UserId);
    }
}

public class OPICSessionConfiguration : IEntityTypeConfiguration<OPICSession>
{
    public void Configure(EntityTypeBuilder<OPICSession> builder)
    {
        builder.ToTable("OPICSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("vi");
        builder.Property(x => x.SessionState).HasMaxLength(30).HasDefaultValue("Orientation");
        builder.Property(x => x.MidAdjustChoice).HasMaxLength(10);
        builder.Property(x => x.OPICLevelResult).HasMaxLength(10);
        builder.Property(x => x.OverallScore).HasColumnType("decimal(5,2)");

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.UserId, x.IsCompleted });

        builder.HasOne<Quiz>()
            .WithMany()
            .HasForeignKey(x => x.QuizId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Survey)
            .WithMany()
            .HasForeignKey(x => x.SurveyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Combos)
            .WithOne(c => c.Session)
            .HasForeignKey(c => c.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.AttemptRefs)
            .WithOne(r => r.Session)
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OPICComboGroupConfiguration : IEntityTypeConfiguration<OPICComboGroup>
{
    public void Configure(EntityTypeBuilder<OPICComboGroup> builder)
    {
        builder.ToTable("OPICComboGroups");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.TopicCategory).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TopicType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.ComboQuestions).HasColumnType("jsonb").HasDefaultValue("[]");
        builder.HasIndex(x => x.SessionId);
    }
}

public class OPICAttemptRefConfiguration : IEntityTypeConfiguration<OPICAttemptRef>
{
    public void Configure(EntityTypeBuilder<OPICAttemptRef> builder)
    {
        builder.ToTable("OPICAttemptRefs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.HasIndex(x => x.SessionId);
        builder.HasIndex(x => x.AttemptId);

        builder.HasOne(x => x.Attempt)
            .WithMany()
            .HasForeignKey(x => x.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OPICLevelResultConfiguration : IEntityTypeConfiguration<OPICLevelResult>
{
    public void Configure(EntityTypeBuilder<OPICLevelResult> builder)
    {
        builder.ToTable("OPICLevelResults");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("vi");
        builder.Property(x => x.AssignedLevel).HasMaxLength(10).IsRequired();
        builder.Property(x => x.OverallScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.PronunciationScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.FluencyScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.CoherenceScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.VocabularyScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.TaskAchievementScore).HasColumnType("decimal(5,2)");
        builder.Property(x => x.LlmLevelJustification).HasColumnType("jsonb");
        builder.Property(x => x.StrongestSkill).HasMaxLength(30);
        builder.Property(x => x.WeakestSkill).HasMaxLength(30);
        builder.Property(x => x.ImprovementAdvice).HasColumnType("text");

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.SessionId).IsUnique();

        builder.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OPICScriptTemplateConfiguration : IEntityTypeConfiguration<OPICScriptTemplate>
{
    public void Configure(EntityTypeBuilder<OPICScriptTemplate> builder)
    {
        builder.ToTable("OPICScriptTemplates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("vi");
        builder.Property(x => x.TopicCategory).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ComboType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.TargetLevel).HasMaxLength(10);
        builder.Property(x => x.OpeningTemplate).HasColumnType("text").IsRequired();
        builder.Property(x => x.BodyTemplate).HasColumnType("text").IsRequired();
        builder.Property(x => x.ClosingTemplate).HasColumnType("text").IsRequired();
        builder.Property(x => x.VocabList).HasColumnType("jsonb");
        builder.Property(x => x.UsefulPhrases).HasColumnType("jsonb");

        builder.HasIndex(x => new { x.TopicCategory, x.Language });
        builder.HasIndex(x => x.CreatedBy);
    }
}
