using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using MLS.API.Filters;
using MLS.API.Resources;
using MLS.Application.Admin.Books;
using MLS.Domain.Interfaces;
using System.Security.Claims;

namespace MLS.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/books")]
[AuthorizeRoles("Admin", "SuperAdmin", "ContentManager")]
public class AdminBooksController(
    IMediator mediator,
    ITenantContext tenantContext,
    IStorageService storage,
    IStringLocalizer<SharedResource> loc) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException());

    // ── List ─────────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] Guid? categoryId = null,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAdminBooksQuery(page, pageSize, search, status, type, categoryId), ct);
        return Ok(result);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBook(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminBookDetailQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookRequest req, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateBookCommand(
            req.Title, req.Type, req.Price, CurrentUserId,
            req.Description, req.ShortDescription, req.Author, req.Publisher, req.Isbn,
            req.CoverColor ?? "#1a3a5c", req.CoverEmoji ?? "📚", req.CoverUrl,
            req.CategoryId, req.Level, req.Tags,
            req.DiscountPrice, req.DiscountEndsAt, req.PageCount,
            req.FileUrl, req.FileSizeMb, req.SampleUrl,
            req.IsFeatured, req.SortOrder), ct);
        return CreatedAtAction(nameof(GetBook), new { id }, new { id });
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBook(Guid id, [FromBody] UpdateBookRequest req, CancellationToken ct)
    {
        var ok = await mediator.Send(new UpdateBookCommand(
            id,
            req.Title, req.Type, req.Price,
            req.Description, req.ShortDescription, req.Author, req.Publisher, req.Isbn,
            req.CoverColor ?? "#1a3a5c", req.CoverEmoji ?? "📚", req.CoverUrl,
            req.CategoryId, req.Level, req.Tags,
            req.DiscountPrice, req.DiscountEndsAt, req.PageCount,
            req.FileUrl, req.FileSizeMb, req.SampleUrl,
            req.IsFeatured, req.SortOrder), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBook(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new DeleteBookCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── Publish / Unpublish ───────────────────────────────────────────────────

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new PublishBookCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id, CancellationToken ct)
    {
        var ok = await mediator.Send(new UnpublishBookCommand(id), ct);
        return ok ? NoContent() : NotFound();
    }

    // ── Translations (III-7) ─────────────────────────────────────────────────

    [HttpGet("{id:guid}/translations")]
    public async Task<IActionResult> GetTranslations(Guid id, CancellationToken ct)
    {
        var items = await mediator.Send(new GetBookTranslationsQuery(id), ct);
        return Ok(items);
    }

    [HttpPut("{id:guid}/translations/{locale}")]
    public async Task<IActionResult> UpsertTranslation(
        Guid id, string locale, [FromBody] UpsertBookTranslationRequest req, CancellationToken ct)
    {
        await mediator.Send(new UpsertBookTranslationCommand(
            id, locale, req.Title, req.ShortDescription, req.Description), ct);
        return NoContent();
    }

    // ── File upload ─────────────────────────────────────────────────────

    [HttpPost("upload-file")]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
    public async Task<IActionResult> UploadFile(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = loc["NoFileUploaded"].Value });

        string[] allowedTypes = ["application/pdf", "application/epub+zip",
            "application/vnd.ms-word",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg", "image/png", "image/webp"];
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedTypes.Contains(file.ContentType) && ext != ".epub" && ext != ".mobi" && ext != ".azw3")
            return BadRequest(new { error = loc["FileTypeNotSupported"].Value });

        if (file.Length > 50 * 1024 * 1024)
            return BadRequest(new { error = loc["FileSizeExceeded"].Value });

        if (string.IsNullOrEmpty(ext)) ext = ".bin";
        var safeFileName = $"book_{Guid.NewGuid():N}{ext}";

        var relativePath = await storage.UploadAsync(
            tenantContext.TenantSlug, "books", safeFileName,
            file.OpenReadStream(), file.ContentType, ct);

        return Ok(new { url = $"/media/{relativePath}" });
    }
}

// ── Request models ────────────────────────────────────────────────────────────

public record CreateBookRequest(
    string Title,
    string Type,
    decimal Price,
    string? Description,
    string? ShortDescription,
    string? Author,
    string? Publisher,
    string? Isbn,
    string? CoverColor,
    string? CoverEmoji,
    string? CoverUrl,
    Guid? CategoryId,
    string? Level,
    string? Tags,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    int? PageCount,
    string? FileUrl,
    decimal? FileSizeMb,
    string? SampleUrl,
    bool IsFeatured = false,
    int SortOrder = 0
);

public record UpdateBookRequest(
    string Title,
    string Type,
    decimal Price,
    string? Description,
    string? ShortDescription,
    string? Author,
    string? Publisher,
    string? Isbn,
    string? CoverColor,
    string? CoverEmoji,
    string? CoverUrl,
    Guid? CategoryId,
    string? Level,
    string? Tags,
    decimal? DiscountPrice,
    DateTime? DiscountEndsAt,
    int? PageCount,
    string? FileUrl,
    decimal? FileSizeMb,
    string? SampleUrl,
    bool IsFeatured = false,
    int SortOrder = 0
);

public record UpsertBookTranslationRequest(
    string? Title,
    string? ShortDescription,
    string? Description
);
