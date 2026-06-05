using MLS.Application.Common.Interfaces;
using StackExchange.Redis;

namespace MLS.Infrastructure.Services;

/// <summary>
/// Redis-backed leaderboard for realtime quiz rooms.
/// Uses sorted sets: ZADD quiz:room:{roomId}:lb {score} {userId}
/// </summary>
public class RedisLeaderboardService : IRealtimeLeaderboardService
{
    private readonly IDatabase _db;

    public RedisLeaderboardService(IConnectionMultiplexer redis)
    {
        _db = redis.GetDatabase();
    }

    private static string Key(string roomId) => $"quiz:room:{roomId}:lb";

    public async Task AddScoreAsync(string roomId, string userId, long points)
    {
        await _db.SortedSetIncrementAsync(Key(roomId), userId, points);
        await _db.KeyExpireAsync(Key(roomId), TimeSpan.FromHours(2));
    }

    public async Task<List<LeaderboardEntry>> GetTopAsync(string roomId, int count = 10)
    {
        var entries = await _db.SortedSetRangeByRankWithScoresAsync(
            Key(roomId), 0, count - 1, Order.Descending);

        return entries.Select((e, i) => new LeaderboardEntry(
            UserId: e.Element!,
            Score:  (long)e.Score,
            Rank:   i + 1
        )).ToList();
    }

    public async Task<long?> GetScoreAsync(string roomId, string userId)
    {
        var score = await _db.SortedSetScoreAsync(Key(roomId), userId);
        return score.HasValue ? (long)score.Value : null;
    }

    public async Task ClearRoomAsync(string roomId)
    {
        await _db.KeyDeleteAsync(Key(roomId));
    }
}
