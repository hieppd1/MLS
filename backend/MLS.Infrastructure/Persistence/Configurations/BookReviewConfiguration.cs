using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MLS.Domain.Entities;

namespace MLS.Infrastructure.Persistence.Configurations;

public class BookReviewConfiguration : IEntityTypeConfiguration<BookReview>
{
    public void Configure(EntityTypeBuilder<BookReview> builder)
    {
        builder.ToTable("BookReviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Rating).IsRequired();
        builder.Property(r => r.Content).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.Title).HasMaxLength(200);

        // One user, one review per book
        builder.HasIndex(r => new { r.BookId, r.UserId }).IsUnique();

        builder.HasOne(r => r.Book)
               .WithMany()
               .HasForeignKey(r => r.BookId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
               .WithMany()
               .HasForeignKey(r => r.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
