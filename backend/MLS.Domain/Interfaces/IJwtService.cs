namespace MLS.Domain.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, string role, string tenantSlug);
    string GenerateRefreshTokenValue();
    string HashToken(string token);
    (Guid userId, string role, string tenantSlug)? ValidateAccessToken(string token);
}
