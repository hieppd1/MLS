using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MLS.API.Middleware;

/// <summary>
/// Adds X-Tenant-Slug header to all Swagger operations.
/// </summary>
public class TenantHeaderOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // TODO: Add X-Tenant-Slug parameter once Microsoft.OpenApi v2 API is stabilized
    }
}
