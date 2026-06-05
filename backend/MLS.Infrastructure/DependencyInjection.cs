using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MLS.Application.Common.Interfaces;
using MLS.Infrastructure.Messaging;
using MLS.Infrastructure.Workers;
using MLS.Domain.Interfaces;
using MLS.Infrastructure.Auth;
using MLS.Infrastructure.Email;
using MLS.Infrastructure.Moodle;
using MLS.Infrastructure.MultiTenancy;
using MLS.Infrastructure.Payment;
using MLS.Infrastructure.Persistence;
using MLS.Infrastructure.Services;
using MLS.Infrastructure.Services;
using MLS.Infrastructure.Shipping;
using MLS.Infrastructure.Storage;
using MLS.Infrastructure.Tenancy;
using StackExchange.Redis;

namespace MLS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // ── Multi-tenancy ────────────────────────────────────────────────────
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());

        // ── Database ─────────────────────────────────────────────────────────
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            var tenant = sp.GetRequiredService<ITenantContext>();
            var connStr = tenant.IsResolved
                ? $"{connectionString};Search Path={tenant.SchemaName},public"
                : connectionString;
            options.UseNpgsql(connStr);
        });

        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<ApplicationDbContext>());

        services.AddScoped<TenantProvisioner>();

        // ── Auth services ─────────────────────────────────────────────────────
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();

        // ── Email service ─────────────────────────────────────────────────────
        // Dev: logs to console. Prod: swap ConsoleEmailService → SendGridEmailService
        services.AddScoped<IEmailService, ConsoleEmailService>();

        // ── Moodle LMS sync ───────────────────────────────────────────────────
        // Enabled = false by default. Set Moodle:Enabled = true + supply a Token once Moodle is running.
        services.Configure<MoodleOptions>(configuration.GetSection(MoodleOptions.Section));
        services.AddHttpClient<IMoodleService, MoodleService>();

        // ── MoMo payment ──────────────────────────────────────────────────────
        services.AddHttpClient<IMomoPaymentService, MomoPaymentService>();

        // ── VNPay payment ─────────────────────────────────────────────────────
        services.AddScoped<IVnPayService, VnPayService>();

        // ── JWT Bearer authentication ─────────────────────────────────────────
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false; // Keep claim names as-is (prevent "role" → ClaimTypes.Role remapping)
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = configuration["Jwt:Issuer"] ?? "mls-api",
                ValidateAudience = true,
                ValidAudience = configuration["Jwt:Audience"] ?? "mls-clients",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                // Map "role" claim → ClaimTypes.Role so [Authorize(Roles=)] works
                RoleClaimType = "role",
                NameClaimType = "sub"
            };

            // Allow SignalR clients to pass JWT via ?access_token=... on /hubs/*
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var accessToken = ctx.Request.Query["access_token"];
                    var path = ctx.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) &&
                        path.StartsWithSegments("/hubs", StringComparison.OrdinalIgnoreCase))
                    {
                        ctx.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("SuperAdmin", p => p.RequireRole("SuperAdmin"))
            .AddPolicy("Admin",      p => p.RequireRole("SuperAdmin", "Admin"))
            .AddPolicy("Teacher",    p => p.RequireRole("SuperAdmin", "Admin", "Teacher"))
            .AddPolicy("Staff",      p => p.RequireRole("SuperAdmin", "Admin", "ContentManager", "Support"))
            .AddPolicy("Enrolled",   p => p.RequireAuthenticatedUser());

        // ── Storage ───────────────────────────────────────────────────────────
        var mediaRoot = configuration["Storage:RootPath"]
            ?? Path.Combine(Directory.GetCurrentDirectory(), "media");

        services.AddSingleton<IStorageService>(new LocalFileStorageService(mediaRoot));

        // ── Phase 3B: Speaking AI queue + worker ──────────────────────────────
        services.AddSingleton<ISpeakingGradingQueue, InMemorySpeakingGradingQueue>();
        services.AddHostedService<SpeakingGradingWorker>();

        // ── Phase 3B: Writing AI queue + worker ───────────────────────────────
        services.AddSingleton<IWritingGradingQueue, InMemoryWritingGradingQueue>();
        services.AddHostedService<WritingGradingWorker>();

        // ── Phase 3C: Realtime Quiz — Redis leaderboard ───────────────────────
        var redisConn = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConn));
        services.AddSingleton<IRealtimeLeaderboardService, RedisLeaderboardService>();

        // ── Shipping ─────────────────────────────────────────────────────────
        services.Configure<ShippingSettings>(configuration.GetSection(ShippingSettings.Section));
        services.AddHttpClient<IShippingProvider, ViettelPostProvider>();

        // ── Notifications ─────────────────────────────────────────────────────
        services.AddScoped<IFcmPushService, StubFcmPushService>();
        services.AddScoped<IInAppNotificationService, InAppNotificationService>();

        // ── SignalR ───────────────────────────────────────────────────────────
        services.AddSignalR();
        services.AddScoped<IQuizNotificationService, QuizHubNotificationService>();
        services.AddScoped<IChatNotificationService, ChatHubNotificationService>();

        return services;
    }
}
