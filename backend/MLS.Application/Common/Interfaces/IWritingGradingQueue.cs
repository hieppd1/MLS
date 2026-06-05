namespace MLS.Application.Common.Interfaces;

public record WritingGradingRequest(
    Guid   SubmissionId,
    Guid   UserId,
    string EssayText,
    int    WordCount,
    string TenantSlug,
    string? TaskType    = null,
    string? EssayType   = null,
    string? ExamModeTag = null);

public interface IWritingGradingQueue
{
    void Enqueue(WritingGradingRequest request);
    bool TryDequeue(out WritingGradingRequest? request);
}
