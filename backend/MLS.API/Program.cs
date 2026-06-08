using MLS.Infrastructure;
using MLS.Application;
using MLS.API.Middleware;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting MLS API...");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/mls-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14));

    builder.Services
        .AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
    {
        o.MultipartBodyLengthLimit = 2_147_483_648; // 2 GB
        o.ValueLengthLimit = int.MaxValue;
    });
    builder.WebHost.ConfigureKestrel(k => k.Limits.MaxRequestBodySize = 2_147_483_648);
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "MLS API", Version = "v1" });

        // JWT Bearer - pass token in Authorization: Bearer <token> header
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter JWT token (without 'Bearer ' prefix)"
        });

        // X-Tenant-Slug header
        c.OperationFilter<TenantHeaderOperationFilter>();
    });

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddLocalization();

    // Prevent background service failures from stopping the host (dev-friendly)
    builder.Services.Configure<HostOptions>(opts =>
        opts.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore);

    // CORS — allow Next.js dev server and configurable origins
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:3000"];

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials());
    });

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    // Ensure public schema Tenants table exists on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MLS.Infrastructure.Persistence.ApplicationDbContext>();
        await MLS.Infrastructure.Persistence.DatabaseInitializer.EnsurePublicSchemaAsync(db);

        // Seed "demo" tenant on first run so developers can register immediately
        var provisioner = scope.ServiceProvider.GetRequiredService<MLS.Infrastructure.Tenancy.TenantProvisioner>();
        await MLS.Infrastructure.Persistence.DatabaseInitializer.SeedDemoTenantAsync(db, provisioner);
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "MLS API v1"));
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseCors();
    app.UseRequestLocalization(options =>
    {
        var supported = new[] { "vi", "en", "ko" };
        options.SetDefaultCulture("vi")
               .AddSupportedCultures(supported)
               .AddSupportedUICultures(supported);
    });
    app.UseWebSockets();

    // Serve stored media files BEFORE TenantMiddleware — browser video requests
    // don't send X-Tenant-Slug, so media must be served without tenant resolution.
    var mediaRoot = builder.Configuration["Storage:RootPath"]
        ?? Path.Combine(Directory.GetCurrentDirectory(), "media");
    Directory.CreateDirectory(mediaRoot);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(mediaRoot),
        RequestPath = "/media",
        ServeUnknownFileTypes = true, // needed for .m3u8 and .ts HLS files
        DefaultContentType = "application/octet-stream",
    });

    app.UseMiddleware<TenantMiddleware>();
    app.UseHttpsRedirection();

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHub<MLS.Infrastructure.Hubs.VideoCommentHub>("/hubs/video-comments")
       .RequireCors(policy => policy
           .WithOrigins(allowedOrigins)
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials());

    app.MapHub<MLS.Infrastructure.Hubs.QuizHub>("/hubs/quiz")
       .RequireCors(policy => policy
           .WithOrigins(allowedOrigins)
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials());

    app.MapHub<MLS.Infrastructure.Hubs.GroupChatHub>("/hubs/group-chat")
       .RequireCors(policy => policy
           .WithOrigins(allowedOrigins)
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials());

    app.MapHub<MLS.Infrastructure.Hubs.SupportChatHub>("/hubs/support")
       .RequireCors(policy => policy
           .WithOrigins(allowedOrigins)
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials());

    app.MapHub<MLS.Infrastructure.Hubs.NotificationHub>("/hubs/notifications")
       .RequireCors(policy => policy
           .WithOrigins(allowedOrigins)
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials());

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }
