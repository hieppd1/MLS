using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.QuizConfig.Commands;

// ── Create ─────────────────────────────────────────────────────────────────────

public record CreateQuizTypeConfigCommand(
    string ExamMode,
    string Value,
    string Label,
    int SortOrder = 0) : IRequest<Guid>;

public class CreateQuizTypeConfigHandler(IApplicationDbContext db)
    : IRequestHandler<CreateQuizTypeConfigCommand, Guid>
{
    public async Task<Guid> Handle(CreateQuizTypeConfigCommand cmd, CancellationToken ct)
    {
        // Prevent duplicate value within same exam mode
        var exists = await db.QuizTypeConfigs
            .AnyAsync(x => x.ExamMode == cmd.ExamMode && x.Value == cmd.Value, ct);
        if (exists)
            throw new InvalidOperationException(
                $"Loại quiz '{cmd.Value}' đã tồn tại trong nền tảng '{cmd.ExamMode}'.");

        var entity = QuizTypeConfig.Create(cmd.ExamMode, cmd.Value, cmd.Label, cmd.SortOrder);
        db.QuizTypeConfigs.Add(entity);
        await db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

// ── Update ─────────────────────────────────────────────────────────────────────

public record UpdateQuizTypeConfigCommand(
    Guid   Id,
    string Label,
    int    SortOrder,
    bool   IsActive) : IRequest<bool>;

public class UpdateQuizTypeConfigHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateQuizTypeConfigCommand, bool>
{
    public async Task<bool> Handle(UpdateQuizTypeConfigCommand cmd, CancellationToken ct)
    {
        var entity = await db.QuizTypeConfigs.FindAsync([cmd.Id], ct);
        if (entity is null) return false;

        entity.Update(cmd.Label, cmd.SortOrder, cmd.IsActive);
        await db.SaveChangesAsync(ct);
        return true;
    }
}

// ── Delete ─────────────────────────────────────────────────────────────────────

public record DeleteQuizTypeConfigCommand(Guid Id) : IRequest<bool>;

public class DeleteQuizTypeConfigHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteQuizTypeConfigCommand, bool>
{
    public async Task<bool> Handle(DeleteQuizTypeConfigCommand cmd, CancellationToken ct)
    {
        var entity = await db.QuizTypeConfigs.FindAsync([cmd.Id], ct);
        if (entity is null) return false;

        db.QuizTypeConfigs.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
