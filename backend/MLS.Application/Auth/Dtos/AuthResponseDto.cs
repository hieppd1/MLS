namespace MLS.Application.Auth.Dtos;

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,          // seconds
    UserInfoDto User
);

public record UserInfoDto(
    Guid Id,
    string Email,
    string? Phone,
    string FullName,
    string Role,
    string? PreferredLocale
);
