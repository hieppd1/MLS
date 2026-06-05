using Microsoft.EntityFrameworkCore;
using MLS.Domain.Interfaces;
using MLS.Infrastructure.Persistence;

namespace MLS.Tests.Helpers;

/// <summary>
/// Creates an in-memory ApplicationDbContext for unit/functional tests.
/// Uses a unique DB name per call to ensure test isolation.
/// </summary>
internal static class InMemoryDbHelper
{
    public static ApplicationDbContext Create(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
            .Options;

        var ctx = new TestApplicationDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    // Subclass that overrides OnConfiguring so Npgsql is never touched in tests
    private sealed class TestApplicationDbContext(DbContextOptions<ApplicationDbContext> opts)
        : ApplicationDbContext(opts, new FakeTenantContext());

    private sealed class FakeTenantContext : ITenantContext
    {
        public string TenantSlug => "test";
        public string SchemaName => "public";
        public bool IsResolved => false;   // prevents Npgsql configuration
    }
}
