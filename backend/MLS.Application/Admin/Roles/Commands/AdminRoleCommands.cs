using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;

namespace MLS.Application.Admin.Roles.Commands;

// ── CreateRole ────────────────────────────────────────────────────────────────
public record CreateRoleCommand(string Name, string? Description) : IRequest<Guid>;

public class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500).When(x => x.Description is not null);
    }
}

public class CreateRoleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateRoleCommand, Guid>
{
    public async Task<Guid> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        var nameTrimmed = request.Name.Trim();

        if (await db.Roles.AnyAsync(r => r.Name == nameTrimmed, cancellationToken))
            throw new ConflictException($"Role '{nameTrimmed}' already exists.");

        var role = Role.Create(nameTrimmed, request.Description?.Trim());
        db.Roles.Add(role);
        await db.SaveChangesAsync(cancellationToken);
        return role.Id;
    }
}

// ── UpdateRole ────────────────────────────────────────────────────────────────
public record UpdateRoleCommand(Guid RoleId, string Name, string? Description) : IRequest<Unit>;

public class UpdateRoleCommandValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500).When(x => x.Description is not null);
    }
}

public class UpdateRoleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateRoleCommand, Unit>
{
    public async Task<Unit> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken)
            ?? throw new NotFoundException("Role", request.RoleId);

        if (role.Name == Role.Names.SuperAdmin)
            throw new ForbiddenException("Cannot modify the SuperAdmin role.");

        var nameTrimmed = request.Name.Trim();

        // Check name collision (excluding self)
        if (await db.Roles.AnyAsync(r => r.Name == nameTrimmed && r.Id != request.RoleId, cancellationToken))
            throw new ConflictException($"Role '{nameTrimmed}' already exists.");

        role.Update(nameTrimmed, request.Description);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// ── DeleteRole ────────────────────────────────────────────────────────────────
public record DeleteRoleCommand(Guid RoleId) : IRequest<Unit>;

public class DeleteRoleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteRoleCommand, Unit>
{
    public async Task<Unit> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await db.Roles
            .Include(r => r.UserRoles)
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken)
            ?? throw new NotFoundException("Role", request.RoleId);

        if (role.Name is Role.Names.SuperAdmin or Role.Names.Admin or Role.Names.Student)
            throw new ForbiddenException($"System role '{role.Name}' cannot be deleted.");

        if (role.UserRoles.Count > 0)
            throw new ConflictException($"Cannot delete role '{role.Name}' because {role.UserRoles.Count} user(s) are assigned to it.");

        db.Roles.Remove(role);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
