using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class TeacherFollower : BaseEntity
{
    public Guid TeacherProfileId { get; private set; }
    public Guid StudentId { get; private set; }

    private TeacherFollower() { }

    public static TeacherFollower Create(Guid teacherProfileId, Guid studentId)
    {
        return new TeacherFollower
        {
            Id = Guid.NewGuid(),
            TeacherProfileId = teacherProfileId,
            StudentId = studentId,
        };
    }
}
