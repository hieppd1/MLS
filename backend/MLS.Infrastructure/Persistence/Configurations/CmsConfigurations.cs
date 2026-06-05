using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("Courses");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Title).IsRequired().HasMaxLength(300);
        builder.Property(c => c.Code).HasMaxLength(50);
        builder.Property(c => c.Slug).HasMaxLength(350);
        builder.Property(c => c.ShortDescription).HasMaxLength(500);
        builder.Property(c => c.Description).HasColumnType("text");
        builder.Property(c => c.ThumbnailUrl).HasMaxLength(500);
        builder.Property(c => c.BannerUrl).HasMaxLength(500);
        builder.Property(c => c.Language).HasMaxLength(10).HasDefaultValue("VI");
        builder.Property(c => c.Tags).HasColumnType("text");
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(c => c.Visibility).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Price).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
        builder.Property(c => c.DiscountPrice).HasColumnType("decimal(18,2)");

        builder.HasMany(c => c.Levels)
            .WithOne(lv => lv.Course)
            .HasForeignKey(lv => lv.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Modules)
            .WithOne(m => m.Course)
            .HasForeignKey(m => m.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Enrollments)
            .WithOne(e => e.Course)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LearningLevelConfiguration : IEntityTypeConfiguration<LearningLevel>
{
    public void Configure(EntityTypeBuilder<LearningLevel> builder)
    {
        builder.ToTable("LearningLevels");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).ValueGeneratedNever();
        builder.Property(l => l.Name).IsRequired().HasMaxLength(200);
        builder.Property(l => l.Description).HasMaxLength(500);
        builder.HasIndex(l => l.OrderIndex);
    }
}

public class CourseLevelConfiguration : IEntityTypeConfiguration<CourseLevel>
{
    public void Configure(EntityTypeBuilder<CourseLevel> builder)
    {
        builder.ToTable("CourseLevels");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).ValueGeneratedNever();
        builder.Property(l => l.Name).IsRequired().HasMaxLength(200);
        builder.Property(l => l.Description).HasMaxLength(1000);
        builder.HasIndex(l => new { l.CourseId, l.OrderIndex });
    }
}

public class CourseModuleConfiguration : IEntityTypeConfiguration<CourseModule>
{
    public void Configure(EntityTypeBuilder<CourseModule> builder)
    {
        builder.ToTable("CourseModules");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.Title).IsRequired().HasMaxLength(300);
        builder.Property(m => m.Description).HasColumnType("text");
        builder.Property(m => m.ThumbnailUrl).HasMaxLength(500);

        builder.HasOne(m => m.Level)
            .WithMany(lv => lv.Modules)
            .HasForeignKey(m => m.LevelId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasMany(m => m.Sessions)
            .WithOne(s => s.Module)
            .HasForeignKey(s => s.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CourseEnrollmentConfiguration : IEntityTypeConfiguration<CourseEnrollment>
{
    public void Configure(EntityTypeBuilder<CourseEnrollment> builder)
    {
        builder.ToTable("CourseEnrollments");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.Source).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
    }
}

public class VideoTrackingConfiguration : IEntityTypeConfiguration<VideoTracking>
{
    public void Configure(EntityTypeBuilder<VideoTracking> builder)
    {
        builder.ToTable("VideoTrackings");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();
        builder.HasIndex(v => new { v.UserId, v.SessionId }).IsUnique();
    }
}

public class BannerSlideConfiguration : IEntityTypeConfiguration<BannerSlide>
{
    public void Configure(EntityTypeBuilder<BannerSlide> builder)
    {
        builder.ToTable("BannerSlides");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).ValueGeneratedNever();
        builder.Property(b => b.Title).IsRequired().HasMaxLength(200);
        builder.Property(b => b.Subtitle).HasMaxLength(300);
        builder.Property(b => b.Description).HasMaxLength(500);
        builder.Property(b => b.ImageUrl).HasMaxLength(500);
        builder.Property(b => b.LinkUrl).HasMaxLength(500);
        builder.Property(b => b.BadgeText).HasMaxLength(100);
        builder.Property(b => b.CtaText).HasMaxLength(100);
        builder.Property(b => b.BgColor).HasMaxLength(20);
        builder.Property(b => b.TextColor).HasMaxLength(20);
    }
}

public class TeacherProfileConfiguration : IEntityTypeConfiguration<TeacherProfile>
{
    public void Configure(EntityTypeBuilder<TeacherProfile> builder)
    {
        builder.ToTable("TeacherProfiles");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).ValueGeneratedNever();
        builder.Property(t => t.UserId).IsRequired();
        builder.Property(t => t.DisplayName).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Slug).IsRequired().HasMaxLength(200);
        builder.Property(t => t.AvatarUrl).HasMaxLength(500);
        builder.Property(t => t.CoverUrl).HasMaxLength(500);
        builder.Property(t => t.Headline).HasMaxLength(300);
        builder.Property(t => t.Bio).HasColumnType("text");
        builder.Property(t => t.Specialization).HasMaxLength(200);
        builder.Property(t => t.FacebookUrl).HasMaxLength(500);
        builder.Property(t => t.YoutubeUrl).HasMaxLength(500);
        builder.Property(t => t.TiktokUrl).HasMaxLength(500);
        builder.Property(t => t.WebsiteUrl).HasMaxLength(500);
        builder.Property(t => t.RatingAverage).HasColumnType("decimal(3,2)");
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.HasIndex(t => t.UserId).IsUnique();
    }
}

public class TeacherFollowerConfiguration : IEntityTypeConfiguration<TeacherFollower>
{
    public void Configure(EntityTypeBuilder<TeacherFollower> builder)
    {
        builder.ToTable("TeacherFollowers");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).ValueGeneratedNever();
        builder.HasIndex(f => new { f.TeacherProfileId, f.StudentId }).IsUnique();
    }
}

// ── V4: Interactive Learning ──────────────────────────────────────────────────

public class SessionConfiguration : IEntityTypeConfiguration<Session>
{
    public void Configure(EntityTypeBuilder<Session> builder)
    {
        builder.ToTable("Sessions");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.Title).IsRequired().HasMaxLength(300);
        builder.Property(s => s.Description).HasColumnType("text");
        builder.Property(s => s.ThumbnailUrl).HasMaxLength(500);
        builder.Property(s => s.PublishStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.SessionType).HasConversion<string>().HasMaxLength(20).HasDefaultValue(SessionType.Interactive);
        builder.Property(s => s.Content).HasColumnType("text");
        builder.Property(s => s.AudioUrl).HasMaxLength(500);
        builder.Property(s => s.DocumentUrl).HasMaxLength(500);
        builder.Property(s => s.Transcript).HasColumnType("text");
        builder.Property(s => s.PassScore).HasDefaultValue(70);
        builder.Property(s => s.DurationMinutes).HasDefaultValue(0);

        builder.HasOne(s => s.VideoAsset)
            .WithOne(v => v.Session)
            .HasForeignKey<SessionVideoAsset>(v => v.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Segments)
            .WithOne(seg => seg.Session)
            .HasForeignKey(seg => seg.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Progresses)
            .WithOne(p => p.Session)
            .HasForeignKey(p => p.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.ModuleId, s.OrderIndex });
    }
}

public class SessionVideoAssetConfiguration : IEntityTypeConfiguration<SessionVideoAsset>
{
    public void Configure(EntityTypeBuilder<SessionVideoAsset> builder)
    {
        builder.ToTable("SessionVideoAssets");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();
        builder.Property(v => v.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(v => v.HlsPath).HasMaxLength(500);
        builder.Property(v => v.ThumbnailUrl).HasMaxLength(500);
        builder.Property(v => v.OriginalFileName).HasMaxLength(255);
    }
}

public class SegmentConfiguration : IEntityTypeConfiguration<Segment>
{
    public void Configure(EntityTypeBuilder<Segment> builder)
    {
        builder.ToTable("Segments");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.Title).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Description).HasColumnType("text");

        builder.HasMany(s => s.Assets)
            .WithOne(a => a.Segment)
            .HasForeignKey(a => a.SegmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Progresses)
            .WithOne(p => p.Segment)
            .HasForeignKey(p => p.SegmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.SessionId, s.OrderIndex });
    }
}

public class LearningAssetConfiguration : IEntityTypeConfiguration<LearningAsset>
{
    public void Configure(EntityTypeBuilder<LearningAsset> builder)
    {
        builder.ToTable("LearningAssets");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.Title).IsRequired().HasMaxLength(200);
        builder.Property(a => a.Description).HasColumnType("text");
        builder.Property(a => a.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(a => a.StartTime).HasDefaultValue(0);
        builder.Property(a => a.EndTime);   // nullable int
        builder.Property(a => a.Metadata).HasColumnType("jsonb").HasDefaultValueSql("jsonb_build_object()");

        builder.HasMany(a => a.Interactions)
            .WithOne(i => i.Asset)
            .HasForeignKey(i => i.AssetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => new { a.SegmentId, a.OrderIndex });
    }
}

public class SessionProgressConfiguration : IEntityTypeConfiguration<SessionProgress>
{
    public void Configure(EntityTypeBuilder<SessionProgress> builder)
    {
        builder.ToTable("SessionProgresses");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(p => new { p.UserId, p.SessionId }).IsUnique();
    }
}

public class SegmentProgressConfiguration : IEntityTypeConfiguration<SegmentProgress>
{
    public void Configure(EntityTypeBuilder<SegmentProgress> builder)
    {
        builder.ToTable("SegmentProgresses");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.HasIndex(p => new { p.UserId, p.SegmentId }).IsUnique();
    }
}

public class LearningAssetInteractionConfiguration : IEntityTypeConfiguration<LearningAssetInteraction>
{
    public void Configure(EntityTypeBuilder<LearningAssetInteraction> builder)
    {
        builder.ToTable("LearningAssetInteractions");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.InteractionType).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(i => new { i.UserId, i.AssetId, i.InteractionType });
    }
}

// ── Phase 2D: Realtime Comments ───────────────────────────────────────────────

public class VideoCommentConfiguration : IEntityTypeConfiguration<VideoComment>
{
    public void Configure(EntityTypeBuilder<VideoComment> builder)
    {
        builder.ToTable("VideoComments");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Content).HasColumnType("text").IsRequired();
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(c => c.Session)
            .WithMany()
            .HasForeignKey(c => c.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ParentComment)
            .WithMany(p => p.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasMany(c => c.Reactions)
            .WithOne(r => r.Comment)
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.SessionId, c.TimestampSecond });
        builder.HasIndex(c => c.UserId);
    }
}

public class CommentReactionConfiguration : IEntityTypeConfiguration<CommentReaction>
{
    public void Configure(EntityTypeBuilder<CommentReaction> builder)
    {
        builder.ToTable("CommentReactions");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.ReactionType).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(r => new { r.CommentId, r.UserId }).IsUnique();
    }
}

// ── Phase 2D: Course Pricing ──────────────────────────────────────────────────

public class CoursePackageConfiguration : IEntityTypeConfiguration<CoursePackage>
{
    public void Configure(EntityTypeBuilder<CoursePackage> builder)
    {
        builder.ToTable("CoursePackages");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasColumnType("text");
        builder.Property(p => p.PackageType).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.OriginalPrice).HasColumnType("decimal(18,2)");
        builder.Property(p => p.SalePrice).HasColumnType("decimal(18,2)");

        builder.HasMany(p => p.Entitlements)
            .WithOne(e => e.Package)
            .HasForeignKey(e => e.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.StudentPackages)
            .WithOne(sp => sp.Package)
            .HasForeignKey(sp => sp.PackageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.CourseId, p.PackageType }).IsUnique();
    }
}

public class PackageEntitlementConfiguration : IEntityTypeConfiguration<PackageEntitlement>
{
    public void Configure(EntityTypeBuilder<PackageEntitlement> builder)
    {
        builder.ToTable("PackageEntitlements");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.FeatureCode).IsRequired().HasMaxLength(100);
        builder.HasIndex(e => new { e.PackageId, e.FeatureCode }).IsUnique();
    }
}

public class StudentPackageConfiguration : IEntityTypeConfiguration<StudentPackage>
{
    public void Configure(EntityTypeBuilder<StudentPackage> builder)
    {
        builder.ToTable("StudentPackages");
        builder.HasKey(sp => sp.Id);
        builder.Property(sp => sp.Id).ValueGeneratedNever();
        builder.Property(sp => sp.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(sp => sp.Student)
            .WithMany()
            .HasForeignKey(sp => sp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(sp => new { sp.StudentId, sp.PackageId }).IsUnique();
        builder.HasIndex(sp => new { sp.StudentId, sp.Status });
    }
}
