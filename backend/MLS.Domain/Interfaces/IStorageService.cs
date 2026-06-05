namespace MLS.Domain.Interfaces;

/// <summary>
/// Abstraction over file storage.
/// Phase 0: implemented by LocalFileStorageService (disk).
/// Phase 3+: can be swapped for MinIO/S3 without changing business logic.
/// </summary>
public interface IStorageService
{
    /// <summary>Save a stream to storage. Returns the relative path/key.</summary>
    Task<string> UploadAsync(string tenantSlug, string folder, string fileName, Stream content, string contentType, CancellationToken ct = default);

    /// <summary>Open a read stream for a stored file.</summary>
    Task<Stream> GetStreamAsync(string filePath, CancellationToken ct = default);

    /// <summary>Delete a file.</summary>
    Task DeleteAsync(string filePath, CancellationToken ct = default);

    /// <summary>Check if a file exists.</summary>
    Task<bool> ExistsAsync(string filePath, CancellationToken ct = default);

    /// <summary>Get full absolute path for local serving (only valid for local storage).</summary>
    string GetAbsolutePath(string filePath);
}
