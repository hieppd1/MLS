using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Orders.Events;

/// <summary>
/// Grants CourseEnrollment for all Course items when an order is paid.
/// Mirrors GrantEbookEntitlementsHandler for course access.
/// </summary>
public class GrantCourseEnrollmentHandler(IApplicationDbContext db)
    : INotificationHandler<OrderPaidEvent>
{
    public async Task Handle(OrderPaidEvent notification, CancellationToken ct)
    {
        var courseItems = notification.Items
            .Where(i => i.ItemType == OrderItemType.Course && i.CourseId.HasValue)
            .ToList();

        if (courseItems.Count == 0) return;

        foreach (var item in courseItems)
        {
            var courseId = item.CourseId!.Value;

            // Idempotent — skip if already enrolled
            var exists = await db.CourseEnrollments
                .AnyAsync(e => e.UserId == notification.UserId && e.CourseId == courseId, ct);

            if (!exists)
            {
                var enrollment = CourseEnrollment.Create(
                    userId:   notification.UserId,
                    courseId: courseId,
                    source:   EnrollmentSource.Payment,
                    orderId:  notification.OrderId);
                db.CourseEnrollments.Add(enrollment);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
