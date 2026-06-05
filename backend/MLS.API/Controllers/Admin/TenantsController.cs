using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MLS.API.Filters;
using MLS.Domain.Entities;
using MLS.Infrastructure.Persistence;
using MLS.Infrastructure.Tenancy;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/tenants")]
[AuthorizeRoles("SuperAdmin")]
public class TenantsController(
    ApplicationDbContext db,
    TenantProvisioner provisioner) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request, CancellationToken ct)
    {
        var slug = request.Slug.ToLowerInvariant().Trim();

        var exists = await db.Tenants.AnyAsync(t => t.Slug == slug, ct);
        if (exists)
            return Conflict(new { error = $"Tenant '{slug}' already exists." });

        var tenant = Tenant.Create(slug, request.Name, request.ContactEmail);
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync(ct);

        // Provision schema + tables + seed roles
        await provisioner.ProvisionAsync(tenant.SchemaName, ct);

        return StatusCode(StatusCodes.Status201Created, new
        {
            tenant.Id,
            tenant.Name,
            tenant.Slug,
            tenant.SchemaName,
            tenant.Status
        });
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetTenants()
    {
        var tenants = db.Tenants
            .Select(t => new { t.Id, t.Name, t.Slug, t.Status, t.CreatedAt })
            .ToList();

        return Ok(tenants);
    }
}

// ── Request DTO ───────────────────────────────────────────────────────────────
public record CreateTenantRequest(string Name, string Slug, string? ContactEmail = null);
