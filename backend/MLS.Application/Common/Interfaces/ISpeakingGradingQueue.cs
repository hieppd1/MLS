namespace MLS.Application.Common.Interfaces;

public record SpeakingGradingRequest(
    Guid SubmissionId,
    Guid UserId,
    string AudioUrl,
    string TenantSlug,
    string? ExamModeTag);

public interface ISpeakingGradingQueue
{
    void Enqueue(SpeakingGradingRequest request);
    bool TryDequeue(out SpeakingGradingRequest? request);
}
