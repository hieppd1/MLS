using MLS.Domain.Interfaces;

namespace MLS.Infrastructure.Storage;

/// <summary>
/// Phase 0-2 storage: saves files to local disk under a configurable root path.
/// The IStorageService interface is already abstract — swap this for MinIO/S3 later
/// by registering a different implementation, zero business logic changes needed.
/// </summary>
public class LocalFileStorageService : IStorageService
{
    private readonly string _rootPath;

    public LocalFileStorageService(string rootPath)
    {
        _rootPath = rootPath;
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> UploadAsync(string tenantSlug, string folder, string fileName, Stream content, string contentType, CancellationToken ct = default)
    {
        // Sanitize inputs to prevent path traversal
        var safeTenant = SanitizePathSegment(tenantSlug);
        var safeFolder = SanitizePathSegment(folder);
        var safeFile = SanitizePathSegment(fileName);

        var relativePath = Path.Combine(safeTenant, safeFolder, safeFile);
        var fullPath = Path.Combine(_rootPath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fileStream, ct);

        // Return relative path (forward slashes for consistency)
        return relativePath.Replace('\\', '/');
    }

    public Task<Stream> GetStreamAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_rootPath, NormalizePath(filePath));
        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Storage file not found: {filePath}");

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_rootPath, NormalizePath(filePath));
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_rootPath, NormalizePath(filePath));
        return Task.FromResult(File.Exists(fullPath));
    }

    public string GetAbsolutePath(string filePath)
        => Path.Combine(_rootPath, NormalizePath(filePath));

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string SanitizePathSegment(string segment)
    {
        // Remove any directory traversal attempts
        var sanitized = segment
            .Replace("..", "")
            .Replace("/", "_")
            .Replace("\\", "_")
            .Trim('_', ' ');

        if (string.IsNullOrWhiteSpace(sanitized))
            throw new ArgumentException($"Invalid path segment: '{segment}'");

        return sanitized;
    }

    private static string NormalizePath(string path)
        => path.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
}
