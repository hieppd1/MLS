using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class ChatSettings : BaseEntity
{
    public int MaxGroupsPerUser { get; private set; } = 3;
    public int MaxMembersPerGroup { get; private set; } = 12;
    public bool AllowImageUpload { get; private set; } = true;
    public bool AllowFileUpload { get; private set; } = true;
    public int MaxImageSizeKb { get; private set; } = 5120;
    public int MaxFileSizeKb { get; private set; } = 20480;
    public string? AllowedMimeTypes { get; private set; }

    private ChatSettings() { }

    public static ChatSettings CreateDefault() => new();

    public void Update(
        int maxGroupsPerUser,
        int maxMembersPerGroup,
        bool allowImageUpload,
        bool allowFileUpload,
        int maxImageSizeKb,
        int maxFileSizeKb,
        string? allowedMimeTypes)
    {
        MaxGroupsPerUser = maxGroupsPerUser;
        MaxMembersPerGroup = maxMembersPerGroup;
        AllowImageUpload = allowImageUpload;
        AllowFileUpload = allowFileUpload;
        MaxImageSizeKb = maxImageSizeKb;
        MaxFileSizeKb = maxFileSizeKb;
        AllowedMimeTypes = allowedMimeTypes;
        SetUpdatedAt();
    }
}
