using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class QuizTypeConfigConfiguration : IEntityTypeConfiguration<QuizTypeConfig>
{
    public void Configure(EntityTypeBuilder<QuizTypeConfig> builder)
    {
        builder.ToTable("quiz_type_configs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever().HasColumnName("id");
        builder.Property(x => x.ExamMode).IsRequired().HasMaxLength(32).HasColumnName("exam_mode");
        builder.Property(x => x.Value).IsRequired().HasMaxLength(64).HasColumnName("value");
        builder.Property(x => x.Label).IsRequired().HasMaxLength(128).HasColumnName("label");
        builder.Property(x => x.SortOrder).HasDefaultValue(0).HasColumnName("sort_order");
        builder.Property(x => x.IsActive).HasDefaultValue(true).HasColumnName("is_active");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(x => x.ExamMode).HasDatabaseName("idx_quiz_type_configs_exam_mode");
        builder.HasIndex(x => new { x.ExamMode, x.Value }).IsUnique()
            .HasDatabaseName("idx_quiz_type_configs_exam_mode_value");
    }
}
