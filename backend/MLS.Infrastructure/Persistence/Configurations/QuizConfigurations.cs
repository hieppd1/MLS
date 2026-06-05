using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class QuizConfiguration : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.ToTable("Quizzes");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.Id).ValueGeneratedNever();
        builder.Property(q => q.Title).IsRequired().HasMaxLength(300);
        builder.Property(q => q.Description).HasColumnType("text");
        builder.Property(q => q.QuizType).HasConversion<string>().HasMaxLength(30);
        builder.Property(q => q.SkillType).HasConversion<string>().HasMaxLength(30);
        builder.Property(q => q.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(q => q.TotalScore).HasColumnType("decimal(8,2)").HasDefaultValue(10m);
        builder.Property(q => q.PassingScore).HasColumnType("decimal(8,2)").HasDefaultValue(7m);
        builder.Property(q => q.ExamMode).HasConversion<string>().HasMaxLength(20).HasDefaultValue(ExamMode.Standard);
        builder.Property(q => q.Language).HasMaxLength(10).HasDefaultValue("vi");

        builder.HasIndex(q => q.CourseId).HasFilter("\"CourseId\" IS NOT NULL");
        builder.HasIndex(q => q.SessionId).HasFilter("\"SessionId\" IS NOT NULL");
        builder.HasIndex(q => q.QuizType);
        builder.HasIndex(q => q.Status);

        builder.HasMany(q => q.Questions)
            .WithOne(qq => qq.Quiz)
            .HasForeignKey(qq => qq.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(q => q.Attempts)
            .WithOne(a => a.Quiz)
            .HasForeignKey(a => a.QuizId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.Id).ValueGeneratedNever();
        builder.Property(q => q.Content).IsRequired().HasColumnType("text");
        builder.Property(q => q.AudioUrl).HasMaxLength(1000);
        builder.Property(q => q.ImageUrl).HasMaxLength(1000);
        builder.Property(q => q.VideoUrl).HasMaxLength(1000);
        builder.Property(q => q.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(q => q.SkillType).HasConversion<string>().HasMaxLength(30);
        builder.Property(q => q.Difficulty).HasConversion<string>().HasMaxLength(10);
        builder.Property(q => q.Explanation).HasColumnType("text");
        builder.Property(q => q.DefaultScore).HasColumnType("decimal(6,2)").HasDefaultValue(1m);
        builder.Property(q => q.Tags).HasColumnType("jsonb");  // JSONB: ["IELTS","grammar"]
        builder.Property(q => q.AudioPlayLimit);
        builder.Property(q => q.ReferenceText).HasColumnType("text");
        builder.Property(q => q.ExamModeTag).HasMaxLength(50);

        builder.HasIndex(q => q.Type);
        builder.HasIndex(q => q.SkillType);
        builder.HasIndex(q => q.CreatedBy);
        builder.HasIndex(q => q.Difficulty);
        builder.HasIndex(q => q.ExamModeTag).HasFilter("\"ExamModeTag\" IS NOT NULL");

        // Soft delete global filter
        builder.HasQueryFilter(q => !q.IsDeleted);

        builder.HasMany(q => q.Options)
            .WithOne(o => o.Question)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class QuestionOptionConfiguration : IEntityTypeConfiguration<QuestionOption>
{
    public void Configure(EntityTypeBuilder<QuestionOption> builder)
    {
        builder.ToTable("QuestionOptions");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();
        builder.Property(o => o.Content).IsRequired().HasColumnType("text");
        builder.Property(o => o.MatchKey).HasMaxLength(100);
        builder.Property(o => o.MatchValue).HasMaxLength(500);
        builder.Property(o => o.FeedbackIfSelected).HasColumnType("text");

        builder.HasIndex(o => o.QuestionId);
    }
}

public class QuizQuestionConfiguration : IEntityTypeConfiguration<QuizQuestion>
{
    public void Configure(EntityTypeBuilder<QuizQuestion> builder)
    {
        builder.ToTable("QuizQuestions");
        builder.HasKey(qq => qq.Id);
        builder.Property(qq => qq.Id).ValueGeneratedNever();
        builder.Property(qq => qq.Score).HasColumnType("decimal(6,2)").HasDefaultValue(1m);

        // DisplayOrder unique per quiz (prevents duplicate ordering)
        builder.HasIndex(qq => new { qq.QuizId, qq.DisplayOrder }).IsUnique();

        builder.HasOne(qq => qq.Question)
            .WithMany(q => q.QuizLinks)
            .HasForeignKey(qq => qq.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class QuizAttemptConfiguration : IEntityTypeConfiguration<QuizAttempt>
{
    public void Configure(EntityTypeBuilder<QuizAttempt> builder)
    {
        builder.ToTable("QuizAttempts");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.State).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.GradingMethod).HasConversion<string>().HasMaxLength(10);
        builder.Property(a => a.Score).HasColumnType("decimal(8,2)");
        builder.Property(a => a.AiScore).HasColumnType("decimal(8,2)");
        builder.Property(a => a.Percentage).HasColumnType("decimal(5,2)");
        builder.Property(a => a.AntiCheatLog).HasColumnType("jsonb");  // JSONB array
        builder.Property(a => a.ExamMeta).HasColumnType("jsonb");      // JSONB mode-specific
        builder.Property(a => a.ExpiresAt);

        // Partial index for in-progress attempts
        builder.HasIndex(a => new { a.UserId, a.State });
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.QuizId);
        builder.HasIndex(a => a.State);
        builder.HasIndex(a => new { a.UserId, a.QuizId });

        builder.HasMany(a => a.Answers)
            .WithOne(ans => ans.Attempt)
            .HasForeignKey(ans => ans.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AttemptAnswerConfiguration : IEntityTypeConfiguration<AttemptAnswer>
{
    public void Configure(EntityTypeBuilder<AttemptAnswer> builder)
    {
        builder.ToTable("AttemptAnswers");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.AnswerValue).HasColumnType("jsonb");  // JSONB
        builder.Property(a => a.AudioUrl).HasMaxLength(1000);
        builder.Property(a => a.EssayText).HasColumnType("text");
        builder.Property(a => a.Score).HasColumnType("decimal(6,2)");
        builder.Property(a => a.AiScore).HasColumnType("decimal(6,2)");
        builder.Property(a => a.AiFeedback).HasColumnType("jsonb");  // JSONB

        builder.HasIndex(a => a.AttemptId);
        builder.HasIndex(a => new { a.AttemptId, a.QuestionId });  // composite for upsert

        builder.HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PlacementResultConfiguration : IEntityTypeConfiguration<PlacementResult>
{
    public void Configure(EntityTypeBuilder<PlacementResult> builder)
    {
        builder.ToTable("PlacementResults");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.Property(p => p.SkillBreakdown).HasColumnType("jsonb");   // JSONB
        builder.Property(p => p.RecommendedPath).HasColumnType("jsonb");  // JSONB

        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => new { p.UserId, p.TestedAt });  // newest result query

        builder.HasOne(p => p.Quiz)
            .WithMany()
            .HasForeignKey(p => p.QuizId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Attempt)
            .WithMany()
            .HasForeignKey(p => p.AttemptId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SpeakingSubmissionConfiguration : IEntityTypeConfiguration<SpeakingSubmission>
{
    public void Configure(EntityTypeBuilder<SpeakingSubmission> builder)
    {
        builder.ToTable("SpeakingSubmissions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.AudioUrl).IsRequired().HasMaxLength(1000);
        builder.Property(s => s.TranscriptText).HasColumnType("text");
        builder.Property(s => s.TranscriptUrl).HasMaxLength(1000);
        builder.Property(s => s.PronunciationScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.FluencyScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.AccuracyScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.CoherenceScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.VocabularyScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.TaskAchievementScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.FinalScore).HasColumnType("decimal(5,2)");
        builder.Property(s => s.PhonemeAnalysis).HasColumnType("jsonb");
        builder.Property(s => s.LlmFeedback).HasColumnType("text");
        builder.Property(s => s.GradingStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.ExamModeTag).HasMaxLength(50);

        builder.HasIndex(s => s.AttemptAnswerId);
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.GradingStatus);

        builder.HasOne(s => s.AttemptAnswer)
            .WithMany()
            .HasForeignKey(s => s.AttemptAnswerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WritingSubmissionConfiguration : IEntityTypeConfiguration<WritingSubmission>
{
    public void Configure(EntityTypeBuilder<WritingSubmission> builder)
    {
        builder.ToTable("WritingSubmissions");
        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).ValueGeneratedNever();
        builder.Property(w => w.EssayText).IsRequired().HasColumnType("text");
        builder.Property(w => w.TaskType).HasMaxLength(20);
        builder.Property(w => w.EssayType).HasMaxLength(30);
        builder.Property(w => w.GrammarErrors).HasColumnType("jsonb");
        builder.Property(w => w.VocabularyAnalysis).HasColumnType("jsonb");
        builder.Property(w => w.GrammarScore).HasColumnType("decimal(5,2)");
        builder.Property(w => w.VocabularyScore).HasColumnType("decimal(5,2)");
        builder.Property(w => w.CoherenceScore).HasColumnType("decimal(5,2)");
        builder.Property(w => w.TaskAchievementScore).HasColumnType("decimal(5,2)");
        builder.Property(w => w.FinalScore).HasColumnType("decimal(5,2)");
        builder.Property(w => w.LlmFeedback).HasColumnType("text");
        builder.Property(w => w.GradingStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(w => w.ExamModeTag).HasMaxLength(50);

        builder.HasIndex(w => w.AttemptAnswerId);
        builder.HasIndex(w => w.UserId);
        builder.HasIndex(w => w.GradingStatus);

        builder.HasOne(w => w.AttemptAnswer)
            .WithMany()
            .HasForeignKey(w => w.AttemptAnswerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

// ── Phase 3C: Realtime Quiz ───────────────────────────────────────────────────

public class RealtimeQuizRoomConfiguration : IEntityTypeConfiguration<RealtimeQuizRoom>
{
    public void Configure(EntityTypeBuilder<RealtimeQuizRoom> builder)
    {
        builder.ToTable("RealtimeQuizRooms");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.RoomCode).IsRequired().HasMaxLength(10);
        builder.Property(r => r.State).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(r => r.RoomCode).IsUnique();
        builder.HasIndex(r => r.HostId);

        builder.HasMany(r => r.Participants)
            .WithOne(p => p.Room)
            .HasForeignKey(p => p.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RoomParticipantConfiguration : IEntityTypeConfiguration<RoomParticipant>
{
    public void Configure(EntityTypeBuilder<RoomParticipant> builder)
    {
        builder.ToTable("RoomParticipants");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.HasIndex(p => p.RoomId);
        builder.HasIndex(p => new { p.RoomId, p.UserId }).IsUnique();
    }
}
