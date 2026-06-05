using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum EnrollmentSource { Payment, Admin, Free }

public class CourseEnrollment : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid CourseId { get; private set; }
    public DateTime EnrolledAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public EnrollmentSource Source { get; private set; }
    public Guid? OrderId { get; private set; }

    public Course Course { get; private set; } = null!;

    private CourseEnrollment() { }

    public static CourseEnrollment Create(Guid userId, Guid courseId, EnrollmentSource source, Guid? orderId = null, DateTime? expiresAt = null)
        => new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CourseId = courseId,
            Source = source,
            OrderId = orderId,
            ExpiresAt = expiresAt,
            EnrolledAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

    public bool IsActive => ExpiresAt == null || ExpiresAt > DateTime.UtcNow;
}
