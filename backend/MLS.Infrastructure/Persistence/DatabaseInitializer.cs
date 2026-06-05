using Microsoft.EntityFrameworkCore;
using MLS.Domain.Entities;
using MLS.Infrastructure.Tenancy;

namespace MLS.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task EnsurePublicSchemaAsync(ApplicationDbContext db)
    {
#pragma warning disable EF1002
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS public.""Tenants"" (
                ""Id"" uuid NOT NULL,
                ""Slug"" varchar(100) NOT NULL,
                ""Name"" varchar(200) NOT NULL,
                ""Domain"" varchar(255) NULL,
                ""Status"" varchar(20) NOT NULL DEFAULT 'Trial',
                ""ContactEmail"" varchar(255) NULL,
                ""CreatedAt"" timestamptz NOT NULL DEFAULT now(),
                ""UpdatedAt"" timestamptz NULL,
                CONSTRAINT ""PK_Tenants"" PRIMARY KEY (""Id""),
                CONSTRAINT ""UQ_Tenants_Slug"" UNIQUE (""Slug"")
            );");
#pragma warning restore EF1002
    }

    /// <summary>
    /// Seeds a "demo" tenant on first startup so developers can register/login immediately.
    /// On every startup, runs ProvisionAsync (idempotent — IF NOT EXISTS) then UpgradeSchemaAsync
    /// so base tables always exist before schema upgrades are applied.
    /// </summary>
    public static async Task SeedDemoTenantAsync(
        ApplicationDbContext db,
        TenantProvisioner provisioner,
        CancellationToken ct = default)
    {
        var exists = await db.Tenants.AnyAsync(ct);
        if (!exists)
        {
            var tenant = Tenant.Create("demo", "Demo Tenant", "admin@demo.local");
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);
        }

        // Always run both steps: ProvisionAsync is idempotent (IF NOT EXISTS),
        // ensuring base tables exist before UpgradeSchemaAsync adds new columns/tables.
        var tenants = await db.Tenants.AsNoTracking().ToListAsync(ct);
        foreach (var t in tenants)
        {
            await provisioner.ProvisionAsync(t.SchemaName, ct);
            await provisioner.UpgradeSchemaAsync(t.SchemaName, ct);
        }
    }
}
