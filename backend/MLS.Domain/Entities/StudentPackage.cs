using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class StudentPackage : BaseEntity
{
    public Guid StudentId { get; private set; }
    public Guid PackageId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? ExpiredDate { get; private set; }
    public StudentPackageStatus Status { get; private set; } = StudentPackageStatus.Active;

    // Navigation
    public User Student { get; private set; } = null!;
    public CoursePackage Package { get; private set; } = null!;

    private StudentPackage() { }

    public static StudentPackage Purchase(Guid studentId, Guid packageId, int durationDay)
    {
        var start = DateTime.UtcNow;
        DateTime? expired = durationDay > 0 ? start.AddDays(durationDay) : null;
        return new()
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            PackageId = packageId,
            StartDate = start,
            ExpiredDate = expired,
            Status = StudentPackageStatus.Active,
            CreatedAt = start,
        };
    }

    public bool IsExpired() => ExpiredDate.HasValue && ExpiredDate.Value < DateTime.UtcNow;

    public void Cancel() { Status = StudentPackageStatus.Cancelled; SetUpdatedAt(); }
    public void Expire() { Status = StudentPackageStatus.Expired; SetUpdatedAt(); }
}
