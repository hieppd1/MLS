namespace MLS.Domain.Interfaces;

/// <summary>
/// Adapter for Moodle LMS REST API operations.
/// All methods are fault-tolerant: they return null / silently log on failure so that
/// the main business flow (registration, profile update) is never blocked by Moodle downtime.
/// </summary>
public interface IMoodleService
{
    /// <summary>
    /// Creates a Moodle user account after our user registers.
    /// Returns the Moodle numeric user ID, or null if sync is disabled or Moodle is unreachable.
    /// </summary>
    Task<long?> CreateUserAsync(Guid userId, string email, string fullName, CancellationToken ct = default);

    /// <summary>
    /// Updates the display name in Moodle after the user edits their profile.
    /// Silently ignored if Moodle sync is disabled or user has no MoodleUserId.
    /// </summary>
    Task UpdateUserAsync(long moodleUserId, string fullName, CancellationToken ct = default);
}
