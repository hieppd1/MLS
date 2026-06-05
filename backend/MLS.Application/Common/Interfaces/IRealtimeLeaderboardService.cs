namespace MLS.Application.Common.Interfaces;

public interface IRealtimeLeaderboardService
{
    Task AddScoreAsync(string roomId, string userId, long points);
    Task<List<LeaderboardEntry>> GetTopAsync(string roomId, int count = 10);
    Task<long?> GetScoreAsync(string roomId, string userId);
    Task ClearRoomAsync(string roomId);
}

public record LeaderboardEntry(string UserId, long Score, long Rank);
