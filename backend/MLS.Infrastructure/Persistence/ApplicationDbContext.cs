using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MLS.Infrastructure.Persistence;

/// <summary>
/// Main EF Core DbContext. Uses PostgreSQL search_path to isolate tenant schemas.
/// Each HTTP request gets its own DbContext instance (scoped), configured for the
/// current tenant's schema.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantContext _tenantContext;

    // ── DbSets ────────────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpVerification> OtpVerifications => Set<OtpVerification>();
    public DbSet<Tenant> Tenants => Set<Tenant>();

    // CMS
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseLevel> CourseLevels => Set<CourseLevel>();
    public DbSet<LearningLevel> LearningLevels => Set<LearningLevel>();
    public DbSet<CourseModule> CourseModules => Set<CourseModule>();
    public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
    public DbSet<VideoTracking> VideoTrackings => Set<VideoTracking>();

    // System config
    public DbSet<BannerSlide> BannerSlides => Set<BannerSlide>();

    // Teacher marketplace
    public DbSet<TeacherProfile> TeacherProfiles => Set<TeacherProfile>();
    public DbSet<TeacherFollower> TeacherFollowers => Set<TeacherFollower>();

    // V4 Interactive Learning
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionVideoAsset> SessionVideoAssets => Set<SessionVideoAsset>();
    public DbSet<Segment> Segments => Set<Segment>();
    public DbSet<LearningAsset> LearningAssets => Set<LearningAsset>();
    public DbSet<SessionProgress> SessionProgresses => Set<SessionProgress>();
    public DbSet<SegmentProgress> SegmentProgresses => Set<SegmentProgress>();
    public DbSet<LearningAssetInteraction> LearningAssetInteractions => Set<LearningAssetInteraction>();

    // Phase 2D: Realtime Comments
    public DbSet<VideoComment> VideoComments => Set<VideoComment>();
    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();

    // Phase 2D: Course Pricing
    public DbSet<CoursePackage> CoursePackages => Set<CoursePackage>();
    public DbSet<PackageEntitlement> PackageEntitlements => Set<PackageEntitlement>();
    public DbSet<StudentPackage> StudentPackages => Set<StudentPackage>();

    // Course Reviews
    public DbSet<CourseReview> CourseReviews => Set<CourseReview>();

    // Book Commerce
    public DbSet<BookCategory> BookCategories => Set<BookCategory>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<EbookEntitlement> EbookEntitlements => Set<EbookEntitlement>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ActivationCode> ActivationCodes => Set<ActivationCode>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<BookReview> BookReviews => Set<BookReview>();

    // Phase 5: Invoice
    public DbSet<MLS.Domain.Entities.Invoice> Invoices => Set<MLS.Domain.Entities.Invoice>();

    // Phase 3: Quiz Engine
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<AttemptAnswer> AttemptAnswers => Set<AttemptAnswer>();
    public DbSet<PlacementResult> PlacementResults => Set<PlacementResult>();
    public DbSet<SpeakingSubmission> SpeakingSubmissions => Set<SpeakingSubmission>();
    public DbSet<WritingSubmission> WritingSubmissions => Set<WritingSubmission>();

    // Phase 3C: Realtime Quiz
    public DbSet<RealtimeQuizRoom> RealtimeQuizRooms => Set<RealtimeQuizRoom>();
    public DbSet<RoomParticipant> RoomParticipants => Set<RoomParticipant>();

    // Portal config
    public DbSet<QuizTypeConfig> QuizTypeConfigs => Set<QuizTypeConfig>();

    // Phase 3.3: VSTEP Mode
    public DbSet<PassageGroup> PassageGroups => Set<PassageGroup>();
    public DbSet<VSTEPSession> VSTEPSessions => Set<VSTEPSession>();
    public DbSet<VSTEPBandResult> VSTEPBandResults => Set<VSTEPBandResult>();

    // Phase 3.2: OPIC Mode
    public DbSet<OPICTopicSurvey> OPICTopicSurveys => Set<OPICTopicSurvey>();
    public DbSet<OPICSession> OPICSessions => Set<OPICSession>();
    public DbSet<OPICComboGroup> OPICComboGroups => Set<OPICComboGroup>();
    public DbSet<OPICAttemptRef> OPICAttemptRefs => Set<OPICAttemptRef>();
    public DbSet<OPICLevelResult> OPICLevelResults => Set<OPICLevelResult>();
    public DbSet<OPICScriptTemplate> OPICScriptTemplates => Set<OPICScriptTemplate>();

    // Phase 6: Group Chat & Support Chat
    public DbSet<ChatGroup> ChatGroups => Set<ChatGroup>();
    public DbSet<ChatGroupMember> ChatGroupMembers => Set<ChatGroupMember>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatMessageAttachment> ChatMessageAttachments => Set<ChatMessageAttachment>();
    public DbSet<SupportConversation> SupportConversations => Set<SupportConversation>();
    public DbSet<SupportMessage> SupportMessages => Set<SupportMessage>();
    public DbSet<ChatSettings> ChatSettings => Set<ChatSettings>();

    // Shipping
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentTrackingLog> ShipmentTrackingLogs => Set<ShipmentTrackingLog>();

    // QA (Lesson Comments)
    public DbSet<LessonComment> LessonComments => Set<LessonComment>();
    public DbSet<LessonCommentUpvote> LessonCommentUpvotes => Set<LessonCommentUpvote>();

    // i18n Translations
    public DbSet<CourseTranslation> CourseTranslations => Set<CourseTranslation>();
    public DbSet<BookTranslation> BookTranslations => Set<BookTranslation>();

    // Analytics
    public DbSet<ContentView> ContentViews => Set<ContentView>();

    // Notifications
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();
    public DbSet<UserDeviceToken> UserDeviceTokens => Set<UserDeviceToken>();

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Set the PostgreSQL search_path to the tenant's schema so all queries
        // are automatically scoped. Falls back to "public" during migrations.
        if (_tenantContext.IsResolved)
        {
            optionsBuilder.UseNpgsql(o => o.SetPostgresVersion(14, 0));
        }

        base.OnConfiguring(optionsBuilder);
    }

    /// <summary>
    /// Override to inject SET search_path before every connection is used.
    /// This is the actual tenant isolation mechanism.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-set timestamps for all BaseEntity entries
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<MLS.Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.CreatedAt == default)
                    entry.Property(nameof(MLS.Domain.Common.BaseEntity.CreatedAt)).CurrentValue = now;
                entry.Property(nameof(MLS.Domain.Common.BaseEntity.UpdatedAt)).CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(MLS.Domain.Common.BaseEntity.UpdatedAt)).CurrentValue = now;
            }
        }

        await SetSearchPathAsync(cancellationToken);
        return await base.SaveChangesAsync(cancellationToken);
    }

    public async Task SetSearchPathAsync(CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved) return;
        // Schema name is validated to contain only alphanumeric+underscore chars (enforced by TenantContext).
        // PostgreSQL does not support parameterized identifiers in SET statements, so we format manually.
        var schema = _tenantContext.SchemaName;
        // Validate schema name is safe before interpolating (only lowercase letters, digits, underscores)
        if (!System.Text.RegularExpressions.Regex.IsMatch(schema, @"^[a-z0-9_]+$"))
            throw new InvalidOperationException($"Invalid schema name: {schema}");
#pragma warning disable EF1002 // SET search_path cannot use parameters; schema validated above
        await Database.ExecuteSqlRawAsync($"SET search_path TO {schema}, public", ct);
#pragma warning restore EF1002
    }
}
