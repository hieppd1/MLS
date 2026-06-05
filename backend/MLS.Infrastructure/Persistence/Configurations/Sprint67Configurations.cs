using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).ValueGeneratedNever();
        builder.Property(n => n.Type).IsRequired().HasMaxLength(50);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(255);
        builder.Property(n => n.Body).IsRequired();
        builder.Property(n => n.LinkUrl).HasMaxLength(500);
        builder.Property(n => n.IsRead).HasDefaultValue(false).ValueGeneratedNever();

        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserDeviceTokenConfiguration : IEntityTypeConfiguration<UserDeviceToken>
{
    public void Configure(EntityTypeBuilder<UserDeviceToken> builder)
    {
        builder.ToTable("UserDeviceTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).ValueGeneratedNever();
        builder.Property(t => t.Token).IsRequired().HasMaxLength(500);
        builder.Property(t => t.Platform).IsRequired().HasMaxLength(20);

        builder.HasIndex(t => new { t.UserId, t.Platform }).IsUnique();
        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LessonCommentConfiguration : IEntityTypeConfiguration<LessonComment>
{
    public void Configure(EntityTypeBuilder<LessonComment> builder)
    {
        builder.ToTable("LessonComments");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Content).IsRequired();
        builder.Property(c => c.UpvoteCount).HasDefaultValue(0).ValueGeneratedNever();
        builder.Property(c => c.IsDeleted).ValueGeneratedNever();
        builder.Property(c => c.IsPinned).ValueGeneratedNever();

        builder.HasIndex(c => new { c.LessonId, c.CreatedAt });
        builder.HasIndex(c => new { c.SessionId, c.CreatedAt });
        builder.HasIndex(c => c.ParentId);

        builder.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class LessonCommentUpvoteConfiguration : IEntityTypeConfiguration<LessonCommentUpvote>
{
    public void Configure(EntityTypeBuilder<LessonCommentUpvote> builder)
    {
        builder.ToTable("LessonCommentUpvotes");
        builder.HasKey(u => new { u.CommentId, u.UserId });

        builder.HasOne(u => u.Comment)
            .WithMany(c => c.Upvotes)
            .HasForeignKey(u => u.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.User)
            .WithMany()
            .HasForeignKey(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
