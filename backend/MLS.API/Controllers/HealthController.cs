using Microsoft.AspNetCore.Mvc;
using MLS.Domain.Interfaces;

namespace MLS.API.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly ITenantContext _tenantContext;

    public HealthController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>Basic liveness check — no tenant required.</summary>
    [HttpGet("/health")]
    public IActionResult Health() => Ok(new
    {
        status = "healthy",
        timestamp = DateTime.UtcNow,
        version = "1.0.0-phase0"
    });

    /// <summary>Tenant-aware check — requires X-Tenant-Slug header.</summary>
    [HttpGet("/health/tenant")]
    public IActionResult TenantHealth() => Ok(new
    {
        status = "healthy",
        tenant = _tenantContext.TenantSlug,
        schema = _tenantContext.SchemaName,
        timestamp = DateTime.UtcNow
    });
}
