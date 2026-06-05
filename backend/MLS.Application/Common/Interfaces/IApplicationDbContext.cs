using Microsoft.EntityFrameworkCore;
using MLS.Domain.Entities;

namespace MLS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<OtpVerification> OtpVerifications { get; }

    // CMS
    DbSet<Course> Courses { get; }
    DbSet<CourseLevel> CourseLevels { get; }
    DbSet<LearningLevel> LearningLevels { get; }
    DbSet<CourseModule> CourseModules { get; }
    DbSet<CourseEnrollment> CourseEnrollments { get; }
    DbSet<VideoTracking> VideoTrackings { get; }

    // System config
    DbSet<BannerSlide> BannerSlides { get; }

    // Teacher marketplace
    DbSet<TeacherProfile> TeacherProfiles { get; }
    DbSet<TeacherFollower> TeacherFollowers { get; }

    // V4 Interactive Learning
    DbSet<Session> Sessions { get; }
    DbSet<SessionVideoAsset> SessionVideoAssets { get; }
    DbSet<Segment> Segments { get; }
    DbSet<LearningAsset> LearningAssets { get; }
    DbSet<SessionProgress> SessionProgresses { get; }
    DbSet<SegmentProgress> SegmentProgresses { get; }
    DbSet<LearningAssetInteraction> LearningAssetInteractions { get; }

    // Phase 2D: Realtime Comments
    DbSet<VideoComment> VideoComments { get; }
    DbSet<CommentReaction> CommentReactions { get; }

    // Phase 2D: Course Pricing
    DbSet<CoursePackage> CoursePackages { get; }
    DbSet<PackageEntitlement> PackageEntitlements { get; }
    DbSet<StudentPackage> StudentPackages { get; }

    // Course Reviews
    DbSet<CourseReview> CourseReviews { get; }

    // Book Commerce
    DbSet<BookCategory> BookCategories { get; }
    DbSet<Book> Books { get; }
    DbSet<EbookEntitlement> EbookEntitlements { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<ActivationCode> ActivationCodes { get; }
    DbSet<Voucher> Vouchers { get; }
    DbSet<BookReview> BookReviews { get; }

    // Phase 5: Invoice
    DbSet<MLS.Domain.Entities.Invoice> Invoices { get; }

    // Phase 3: Quiz Engine
    DbSet<MLS.Domain.Entities.Quiz> Quizzes { get; }
    DbSet<MLS.Domain.Entities.Question> Questions { get; }
    DbSet<MLS.Domain.Entities.QuestionOption> QuestionOptions { get; }
    DbSet<MLS.Domain.Entities.QuizQuestion> QuizQuestions { get; }
    DbSet<MLS.Domain.Entities.QuizAttempt> QuizAttempts { get; }
    DbSet<MLS.Domain.Entities.AttemptAnswer> AttemptAnswers { get; }
    DbSet<MLS.Domain.Entities.PlacementResult> PlacementResults { get; }
    DbSet<MLS.Domain.Entities.SpeakingSubmission> SpeakingSubmissions { get; }
    DbSet<MLS.Domain.Entities.WritingSubmission> WritingSubmissions { get; }

    // Phase 3C: Realtime Quiz
    DbSet<MLS.Domain.Entities.RealtimeQuizRoom> RealtimeQuizRooms { get; }
    DbSet<MLS.Domain.Entities.RoomParticipant> RoomParticipants { get; }

    // Portal config
    DbSet<MLS.Domain.Entities.QuizTypeConfig> QuizTypeConfigs { get; }

    // Phase 3.3: VSTEP Mode
    DbSet<MLS.Domain.Entities.PassageGroup> PassageGroups { get; }
    DbSet<MLS.Domain.Entities.VSTEPSession> VSTEPSessions { get; }
    DbSet<MLS.Domain.Entities.VSTEPBandResult> VSTEPBandResults { get; }

    // Phase 3.2: OPIC Mode
    DbSet<MLS.Domain.Entities.OPICTopicSurvey> OPICTopicSurveys { get; }
    DbSet<MLS.Domain.Entities.OPICSession> OPICSessions { get; }
    DbSet<MLS.Domain.Entities.OPICComboGroup> OPICComboGroups { get; }
    DbSet<MLS.Domain.Entities.OPICAttemptRef> OPICAttemptRefs { get; }
    DbSet<MLS.Domain.Entities.OPICLevelResult> OPICLevelResults { get; }
    DbSet<MLS.Domain.Entities.OPICScriptTemplate> OPICScriptTemplates { get; }

    // Phase 6: Group Chat & Support Chat
    DbSet<MLS.Domain.Entities.ChatGroup> ChatGroups { get; }
    DbSet<MLS.Domain.Entities.ChatGroupMember> ChatGroupMembers { get; }
    DbSet<MLS.Domain.Entities.ChatMessage> ChatMessages { get; }
    DbSet<MLS.Domain.Entities.ChatMessageAttachment> ChatMessageAttachments { get; }
    DbSet<MLS.Domain.Entities.SupportConversation> SupportConversations { get; }
    DbSet<MLS.Domain.Entities.SupportMessage> SupportMessages { get; }
    DbSet<MLS.Domain.Entities.ChatSettings> ChatSettings { get; }

    // Shipping
    DbSet<MLS.Domain.Entities.Shipment> Shipments { get; }
    DbSet<MLS.Domain.Entities.ShipmentTrackingLog> ShipmentTrackingLogs { get; }

    // QA (Lesson Comments)
    DbSet<MLS.Domain.Entities.LessonComment> LessonComments { get; }
    DbSet<MLS.Domain.Entities.LessonCommentUpvote> LessonCommentUpvotes { get; }

    // i18n Translations
    DbSet<MLS.Domain.Entities.CourseTranslation> CourseTranslations { get; }
    DbSet<MLS.Domain.Entities.BookTranslation> BookTranslations { get; }

    // Analytics
    DbSet<MLS.Domain.Entities.ContentView> ContentViews { get; }

    // Notifications
    DbSet<MLS.Domain.Entities.Notification> Notifications { get; }
    DbSet<MLS.Domain.Entities.NotificationTemplate> NotificationTemplates { get; }
    DbSet<MLS.Domain.Entities.UserDeviceToken> UserDeviceTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
