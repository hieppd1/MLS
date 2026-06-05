using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Common;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using System.Text.RegularExpressions;

namespace MLS.Application.Admin.Users.Commands;

// ── UpdateStatus ──────────────────────────────────────────────────────────────
public record UpdateUserStatusCommand(Guid UserId, string Status) : IRequest<Unit>;

public class UpdateUserStatusCommandValidator : AbstractValidator<UpdateUserStatusCommand>
{
    public UpdateUserStatusCommandValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => s is "Active" or "Suspended" or "Inactive")
            .WithMessage("Status must be Active, Suspended, or Inactive.");
    }
}

public class UpdateUserStatusCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateUserStatusCommand, Unit>
{
    public async Task<Unit> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        switch (request.Status)
        {
            case "Active": user.Activate(); break;
            case "Suspended": user.Suspend(); break;
            case "Inactive": user.Deactivate(); break;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// ── AssignRole ────────────────────────────────────────────────────────────────
public record AssignRoleCommand(Guid UserId, string RoleName) : IRequest<Unit>;

public class AssignRoleCommandValidator : AbstractValidator<AssignRoleCommand>
{
    public AssignRoleCommandValidator()
    {
        RuleFor(x => x.RoleName)
            .NotEmpty()
            .Must(r => r is "Admin" or "ContentManager" or "Teacher" or "Support" or "Student")
            .WithMessage("Invalid role. SuperAdmin role cannot be assigned via this endpoint.");
    }
}

public class AssignRoleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<AssignRoleCommand, Unit>
{
    public async Task<Unit> Handle(AssignRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        var newRole = await db.Roles
            .FirstOrDefaultAsync(r => r.Name == request.RoleName, cancellationToken)
            ?? throw new NotFoundException("Role", request.RoleName);

        // Remove existing non-SuperAdmin roles (1 role per user)
        var existingRoles = await db.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == request.UserId && ur.Role.Name != Role.Names.SuperAdmin)
            .ToListAsync(cancellationToken);

        db.UserRoles.RemoveRange(existingRoles);
        db.UserRoles.Add(UserRole.Create(request.UserId, newRole.Id));

        // Auto-create TeacherProfile if assigning Teacher role and profile doesn't exist
        if (request.RoleName == "Teacher")
        {
            var hasProfile = await db.TeacherProfiles
                .AnyAsync(p => p.UserId == request.UserId, cancellationToken);
            if (!hasProfile)
            {
                var displayName = user.Profile?.FullName ?? user.Email.Split('@')[0];
                var slug = AdminUserHelpers.GenerateTeacherSlug(displayName, request.UserId);
                db.TeacherProfiles.Add(TeacherProfile.Create(request.UserId, displayName, slug));
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// ── InviteUser ────────────────────────────────────────────────────────────────
public record InviteUserCommand(string Email, string RoleName, string InviterName, string TenantName)
    : IRequest<Unit>;

public class InviteUserCommandValidator : AbstractValidator<InviteUserCommand>
{
    public InviteUserCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.RoleName)
            .NotEmpty()
            .Must(r => r is "Admin" or "ContentManager" or "Teacher" or "Support" or "Student")
            .WithMessage("Invalid role.");
    }
}

public class InviteUserCommandHandler(
    IApplicationDbContext db,
    IEmailService emailService,
    ITenantContext tenantContext) : IRequestHandler<InviteUserCommand, Unit>
{
    private const string FrontendBaseUrl = "http://localhost:3000"; // overridden by config in production

    public async Task<Unit> Handle(InviteUserCommand request, CancellationToken cancellationToken)
    {
        var emailLower = request.Email.ToLowerInvariant().Trim();

        // If user already exists, skip creating OTP — just send invitation
        var userExists = await db.Users.AnyAsync(u => u.Email == emailLower, cancellationToken);

        // Generate invite link (for new users, pre-fill email on register page)
        var inviteLink = $"{FrontendBaseUrl}/register?email={Uri.EscapeDataString(emailLower)}&role={Uri.EscapeDataString(request.RoleName)}&tenant={Uri.EscapeDataString(tenantContext.TenantSlug)}";

        await emailService.SendInvitationAsync(
            emailLower,
            request.InviterName,
            request.TenantName,
            inviteLink,
            cancellationToken);

        return Unit.Value;
    }
}

// ── CreateUser ────────────────────────────────────────────────────────────────
public record CreateUserCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone,
    string RoleName
) : IRequest<Guid>;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone is not null);
        RuleFor(x => x.RoleName)
            .NotEmpty()
            .Must(r => r is "Admin" or "ContentManager" or "Teacher" or "Support" or "Student")
            .WithMessage("Invalid role.");
    }
}

public class CreateUserCommandHandler(IApplicationDbContext db, IPasswordHasher passwordHasher)
    : IRequestHandler<CreateUserCommand, Guid>
{
    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var emailLower = request.Email.ToLowerInvariant().Trim();

        if (await db.Users.AnyAsync(u => u.Email == emailLower, cancellationToken))
            throw new ValidationException("Email already exists.");

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName, cancellationToken)
            ?? throw new NotFoundException("Role", request.RoleName);

        var hash = passwordHasher.Hash(request.Password);
        var user = User.CreateWithEmail(emailLower, hash);
        user.Activate(); // Admin-created users are immediately active

        if (request.Phone is not null)
            user.SetPhone(request.Phone);

        db.Users.Add(user);

        var profile = UserProfile.Create(user.Id, request.FullName);
        db.UserProfiles.Add(profile);

        db.UserRoles.Add(UserRole.Create(user.Id, role.Id));

        // Auto-create TeacherProfile if role is Teacher
        if (request.RoleName == "Teacher")
        {
            var slug = AdminUserHelpers.GenerateTeacherSlug(request.FullName, user.Id);
            db.TeacherProfiles.Add(TeacherProfile.Create(user.Id, request.FullName, slug));
        }

        await db.SaveChangesAsync(cancellationToken);
        return user.Id;
    }
}

// ── AdminUserHelpers ──────────────────────────────────────────────────────────
internal static class AdminUserHelpers
{
    internal static string GenerateTeacherSlug(string displayName, Guid userId)
    {
        var slug = displayName.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-");
        // Keep only ASCII alphanumeric and hyphens (strip Vietnamese diacritics etc.)
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = slug.Trim('-');
        if (string.IsNullOrWhiteSpace(slug)) slug = "teacher";
        slug += "-" + userId.ToString("N")[..8];
        return slug;
    }
}

// ── UpdateUser ────────────────────────────────────────────────────────────────
public record UpdateUserCommand(
    Guid UserId,
    string FullName,
    string? Phone,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Address,
    string? CurrentLevel
) : IRequest<Unit>;

public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone is not null);
    }
}

public class UpdateUserCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateUserCommand, Unit>
{
    public async Task<Unit> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        if (request.Phone is not null)
            user.SetPhone(request.Phone);

        if (user.Profile is not null)
            user.Profile.Update(request.FullName, user.Profile.AvatarUrl, request.DateOfBirth, request.Gender, request.Address, request.CurrentLevel);
        else
            db.UserProfiles.Add(UserProfile.Create(user.Id, request.FullName));

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// ── DeleteUser ────────────────────────────────────────────────────────────────
public record DeleteUserCommand(Guid UserId) : IRequest<Unit>;

public class DeleteUserCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteUserCommand, Unit>
{
    public async Task<Unit> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
            ?? throw new NotFoundException("User", request.UserId);

        // Prevent deleting SuperAdmin accounts
        if (user.UserRoles.Any(ur => ur.Role.Name == Role.Names.SuperAdmin))
            throw new ForbiddenException("Cannot delete a SuperAdmin account.");

        // Revoke all tokens then remove
        var tokens = await db.RefreshTokens.Where(t => t.UserId == request.UserId).ToListAsync(cancellationToken);
        db.RefreshTokens.RemoveRange(tokens);

        // Remove OTPs associated with this user's email
        var otps = await db.OtpVerifications.Where(o => o.Target == user.Email).ToListAsync(cancellationToken);
        db.OtpVerifications.RemoveRange(otps);

        db.UserRoles.RemoveRange(user.UserRoles);
        db.Users.Remove(user);

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
