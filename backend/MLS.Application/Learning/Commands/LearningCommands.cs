using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Learning.Commands;

// ── Save Video Position (upsert) ──────────────────────────────────────────────

public record SaveVideoPositionCommand(Guid SessionId, Guid UserId, int PositionSeconds, int DurationSeconds) : IRequest<Unit>;

public class SaveVideoPositionHandler(IApplicationDbContext db)
    : IRequestHandler<SaveVideoPositionCommand, Unit>
{
    public async Task<Unit> Handle(SaveVideoPositionCommand cmd, CancellationToken ct)
    {
        var tracking = await db.VideoTrackings
            .FirstOrDefaultAsync(t => t.UserId == cmd.UserId && t.SessionId == cmd.SessionId, ct);

        if (tracking == null)
        {
            db.VideoTrackings.Add(VideoTracking.Create(cmd.UserId, cmd.SessionId, cmd.PositionSeconds, cmd.DurationSeconds));
        }
        else
        {
            tracking.Update(cmd.PositionSeconds, cmd.DurationSeconds);
        }

        await db.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// ── Enroll in Course (free / admin) ──────────────────────────────────────────

public record EnrollCourseCommand(Guid CourseId, Guid UserId, string Source = "Free") : IRequest<Unit>;

public class EnrollCourseHandler(IApplicationDbContext db)
    : IRequestHandler<EnrollCourseCommand, Unit>
{
    public async Task<Unit> Handle(EnrollCourseCommand cmd, CancellationToken ct)
    {
        var exists = await db.CourseEnrollments
            .AnyAsync(e => e.UserId == cmd.UserId && e.CourseId == cmd.CourseId, ct);

        if (!exists)
        {
            var source = cmd.Source switch
            {
                "Admin" => EnrollmentSource.Admin,
                "Payment" => EnrollmentSource.Payment,
                _ => EnrollmentSource.Free,
            };
            db.CourseEnrollments.Add(
                CourseEnrollment.Create(cmd.UserId, cmd.CourseId, source));
            await db.SaveChangesAsync(ct);

            // Auto-add student to the course chat group (if exists)
            var courseGroup = await db.ChatGroups
                .FirstOrDefaultAsync(g => g.CourseId == cmd.CourseId && g.IsCourseGroup && g.IsActive, ct);
            if (courseGroup != null)
            {
                var alreadyMember = await db.ChatGroupMembers
                    .AnyAsync(m => m.GroupId == courseGroup.Id && m.UserId == cmd.UserId, ct);
                if (!alreadyMember)
                {
                    var member = ChatGroupMember.Create(
                        courseGroup.Id, cmd.UserId,
                        ChatGroupMemberRole.Member, ChatGroupMemberStatus.Approved);
                    courseGroup.IncrementMembers();
                    db.ChatGroupMembers.Add(member);
                    await db.SaveChangesAsync(ct);
                }
            }
        }

        return Unit.Value;
    }
}
