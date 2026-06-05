using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class ChatGroupConfiguration : IEntityTypeConfiguration<ChatGroup>
{
    public void Configure(EntityTypeBuilder<ChatGroup> builder)
    {
        builder.ToTable("ChatGroups");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).ValueGeneratedNever();
        builder.Property(g => g.Name).IsRequired().HasMaxLength(200);
        builder.Property(g => g.Description).HasMaxLength(2000);
        builder.Property(g => g.AvatarUrl).HasMaxLength(1000);
        builder.Property(g => g.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(g => g.Tags).HasMaxLength(500);
        builder.Property(g => g.MaxMembers).HasDefaultValue(12);
        builder.Property(g => g.CurrentMembers).HasDefaultValue(0);
        builder.Property(g => g.IsActive).HasDefaultValue(true);
        builder.Property(g => g.CourseId);
        builder.Property(g => g.IsCourseGroup).HasDefaultValue(false);

        builder.HasIndex(g => new { g.IsActive, g.Type });
        builder.HasIndex(g => g.CreatedBy);

        builder.HasMany(g => g.Members)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Messages)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ChatGroupMemberConfiguration : IEntityTypeConfiguration<ChatGroupMember>
{
    public void Configure(EntityTypeBuilder<ChatGroupMember> builder)
    {
        builder.ToTable("ChatGroupMembers");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();
        builder.HasIndex(m => new { m.UserId, m.Status });
    }
}

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.Content).HasColumnType("text");
        builder.Property(m => m.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(m => new { m.GroupId, m.CreatedAt });
        builder.HasIndex(m => m.SenderId);

        builder.HasOne(m => m.ReplyTo)
            .WithMany()
            .HasForeignKey(m => m.ReplyToId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(m => m.Attachments)
            .WithOne(a => a.Message)
            .HasForeignKey(a => a.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ChatMessageAttachmentConfiguration : IEntityTypeConfiguration<ChatMessageAttachment>
{
    public void Configure(EntityTypeBuilder<ChatMessageAttachment> builder)
    {
        builder.ToTable("ChatMessageAttachments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.FileUrl).IsRequired().HasMaxLength(1000);
        builder.Property(a => a.FileName).IsRequired().HasMaxLength(500);
        builder.Property(a => a.MimeType).HasMaxLength(150);

        builder.HasIndex(a => a.MessageId);
    }
}

public class SupportConversationConfiguration : IEntityTypeConfiguration<SupportConversation>
{
    public void Configure(EntityTypeBuilder<SupportConversation> builder)
    {
        builder.ToTable("SupportConversations");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(c => new { c.Status, c.LastMessageAt });
        builder.HasIndex(c => c.StudentId);
        builder.HasIndex(c => c.SupportUserId);

        builder.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SupportMessageConfiguration : IEntityTypeConfiguration<SupportMessage>
{
    public void Configure(EntityTypeBuilder<SupportMessage> builder)
    {
        builder.ToTable("SupportMessages");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.SenderRole).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.Content).HasColumnType("text");
        builder.Property(m => m.FileUrl).HasMaxLength(1000);
        builder.Property(m => m.FileName).HasMaxLength(500);
        builder.Property(m => m.MimeType).HasMaxLength(150);

        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt });
    }
}

public class ChatSettingsConfiguration : IEntityTypeConfiguration<ChatSettings>
{
    public void Configure(EntityTypeBuilder<ChatSettings> builder)
    {
        builder.ToTable("ChatSettings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();
        builder.Property(s => s.AllowedMimeTypes).HasMaxLength(2000);
    }
}
