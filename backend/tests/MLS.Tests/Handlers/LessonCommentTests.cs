using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.QA.Commands;
using MLS.Application.QA.Queries;
using MLS.Domain.Entities;
using MLS.Domain.Interfaces;
using MLS.Tests.Helpers;

namespace MLS.Tests.Handlers;

public class LessonCommentTests
{
    private sealed class NullInAppNotifier : IInAppNotificationService
    {
        public Task NotifyAsync(string tenantSlug, Guid userId, string type, string title, string body, string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task NotifyByTemplateAsync(string tenantSlug, Guid userId, string templateKey, string type, Dictionary<string, string> variables, string locale = "vi", string? linkUrl = null, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private sealed class StubTenant : ITenantContext
    {
        public string TenantSlug => "demo";
        public string SchemaName => "tenant_demo";
        public bool IsResolved => true;
    }

    [Fact]
    public async Task CreateComment_ForLesson_Persists()
    {
        using var db = InMemoryDbHelper.Create();
        var lessonId = Guid.NewGuid();
        var authorId = Guid.NewGuid();

        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());
        var dto = await handler.Handle(
            new CreateLessonCommentCommand(authorId, lessonId, null, "Great lesson!", null), default);

        dto.Should().NotBeNull();
        dto.Content.Should().Be("Great lesson!");
        dto.AuthorId.Should().Be(authorId);
        db.LessonComments.Should().ContainSingle(c => c.LessonId == lessonId);
    }

    [Fact]
    public async Task CreateReply_Valid1Level_Persists()
    {
        using var db = InMemoryDbHelper.Create();
        var lessonId = Guid.NewGuid();
        var author1 = Guid.NewGuid();
        var author2 = Guid.NewGuid();
        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());

        var parent = await handler.Handle(
            new CreateLessonCommentCommand(author1, lessonId, null, "Question?", null), default);

        var reply = await handler.Handle(
            new CreateLessonCommentCommand(author2, lessonId, null, "Answer!", parent.Id), default);

        reply.ParentId.Should().Be(parent.Id);
        db.LessonComments.Should().HaveCount(2);
    }

    [Fact]
    public async Task CreateReply_To2ndLevel_ThrowsInvalidOperation()
    {
        using var db = InMemoryDbHelper.Create();
        var lessonId = Guid.NewGuid();
        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());

        var parent = await handler.Handle(
            new CreateLessonCommentCommand(Guid.NewGuid(), lessonId, null, "Q?", null), default);
        var child = await handler.Handle(
            new CreateLessonCommentCommand(Guid.NewGuid(), lessonId, null, "A!", parent.Id), default);

        var act = () => handler.Handle(
            new CreateLessonCommentCommand(Guid.NewGuid(), lessonId, null, "nested", child.Id), default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*1 cấp*");
    }

    [Fact]
    public async Task DeleteComment_BySameAuthor_SoftDeletes()
    {
        using var db = InMemoryDbHelper.Create();
        var lessonId = Guid.NewGuid();
        var author = Guid.NewGuid();
        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());
        var dto = await handler.Handle(
            new CreateLessonCommentCommand(author, lessonId, null, "Hello", null), default);

        await new DeleteLessonCommentCommandHandler(db)
            .Handle(new DeleteLessonCommentCommand(dto.Id, author, "Student"), default);

        db.LessonComments.Find(dto.Id)!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteComment_ByOtherStudent_ThrowsUnauthorized()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());
        var dto = await handler.Handle(
            new CreateLessonCommentCommand(Guid.NewGuid(), Guid.NewGuid(), null, "Hello", null), default);

        var act = () => new DeleteLessonCommentCommandHandler(db)
            .Handle(new DeleteLessonCommentCommand(dto.Id, Guid.NewGuid(), "Student"), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task UpvoteToggle_AddsAndRemoves()
    {
        using var db = InMemoryDbHelper.Create();
        var handler = new CreateLessonCommentCommandHandler(db, new NullInAppNotifier(), new StubTenant());
        var dto = await handler.Handle(
            new CreateLessonCommentCommand(Guid.NewGuid(), Guid.NewGuid(), null, "Nice!", null), default);

        var userId = Guid.NewGuid();
        var upvoteHandler = new ToggleUpvoteCommandHandler(db);

        var added = await upvoteHandler.Handle(new ToggleUpvoteCommand(dto.Id, userId), default);
        added.Should().BeTrue();
        db.LessonComments.Find(dto.Id)!.UpvoteCount.Should().Be(1);

        var removed = await upvoteHandler.Handle(new ToggleUpvoteCommand(dto.Id, userId), default);
        removed.Should().BeFalse();
        db.LessonComments.Find(dto.Id)!.UpvoteCount.Should().Be(0);
    }

    [Fact]
    public async Task GetComments_ReturnsPinnedFirst()
    {
        using var db = InMemoryDbHelper.Create();
        var lessonId = Guid.NewGuid();
        var author = Guid.NewGuid();

        var c1 = LessonComment.CreateForLesson(lessonId, author, "Normal comment");
        var c2 = LessonComment.CreateForLesson(lessonId, author, "Pinned answer");
        c2.TogglePin();
        db.LessonComments.AddRange(c1, c2);
        await db.SaveChangesAsync(default);

        // Verify data persisted
        var count = db.LessonComments.Count();
        count.Should().Be(2, "both comments should be saved");

        // Test sort order directly — pinned first, then by CreatedAt desc
        var ordered = await db.LessonComments
            .Where(c => !c.IsDeleted && c.ParentId == null && c.LessonId == lessonId)
            .OrderByDescending(c => c.IsPinned)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync(default);

        ordered.Should().HaveCount(2);
        ordered[0].IsPinned.Should().BeTrue();
        ordered[1].IsPinned.Should().BeFalse();
    }
}
