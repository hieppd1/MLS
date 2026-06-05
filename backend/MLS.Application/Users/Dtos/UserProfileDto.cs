namespace MLS.Application.Users.Dtos;

public record UserProfileDto(
    Guid Id,
    string Email,
    string? Phone,
    string FullName,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Gender,
    string? Address,
    string? CurrentLevel,
    string Role,
    DateTime CreatedAt,
    string? PreferredLocale
);
