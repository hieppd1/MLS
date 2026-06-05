using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class UserDeviceToken : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public string Platform { get; private set; } = string.Empty; // web / android / ios

    public User User { get; private set; } = null!;

    private UserDeviceToken() { }

    public static UserDeviceToken Create(Guid userId, string token, string platform)
        => new()
        {
            UserId = userId,
            Token = token,
            Platform = platform.ToLowerInvariant(),
        };

    public void UpdateToken(string token)
    {
        Token = token;
        SetUpdatedAt();
    }
}
