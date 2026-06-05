namespace MLS.Application.OPIC.Services;

/// <summary>
/// Aggregated per-question scores used to calculate the overall OPIC level.
/// </summary>
public record OPICScoreAggregate(
    decimal PronunciationAvg,
    decimal FluencyAvg,
    decimal CoherenceAvg,
    decimal VocabularyAvg,
    decimal TaskAchievementAvg);

/// <summary>
/// Result from the OPIC level mapping engine.
/// </summary>
public record OPICLevelEngineResult(
    string  AssignedLevel,
    decimal OverallScore,
    string  StrongestSkill,
    string  WeakestSkill);

/// <summary>
/// Calculates the OPIC level band (NH → AL) from aggregated speaking scores.
/// </summary>
public static class OPICLevelEngine
{
    // OPIC level thresholds (weightedScore 0–100)
    private static readonly (decimal MinScore, string Level)[] Thresholds =
    [
        (90m, "AL"),
        (78m, "IH"),
        (66m, "IM3"),
        (54m, "IM2"),
        (42m, "IM1"),
        (30m, "IL"),
        ( 0m, "NH"),
    ];

    // Skill weights for overall score calculation
    private const decimal WPronunciation   = 0.20m;
    private const decimal WFluency         = 0.25m;
    private const decimal WCoherence       = 0.25m;
    private const decimal WVocabulary      = 0.20m;
    private const decimal WTaskAchievement = 0.10m;

    public static OPICLevelEngineResult Calculate(
        OPICScoreAggregate scores,
        int? chosenDifficulty = null)
    {
        var weighted =
            scores.PronunciationAvg   * WPronunciation +
            scores.FluencyAvg         * WFluency +
            scores.CoherenceAvg       * WCoherence +
            scores.VocabularyAvg      * WVocabulary +
            scores.TaskAchievementAvg * WTaskAchievement;

        var overall = Math.Round(weighted, 2);

        // Determine raw level
        var level = Thresholds.First(t => overall >= t.MinScore).Level;

        // Cap level based on chosen difficulty (student chose easy → max IM2)
        level = ApplyDifficultyCap(level, chosenDifficulty);

        // Determine strongest and weakest
        var skillMap = new Dictionary<string, decimal>
        {
            ["pronunciation"]    = scores.PronunciationAvg,
            ["fluency"]          = scores.FluencyAvg,
            ["coherence"]        = scores.CoherenceAvg,
            ["vocabulary"]       = scores.VocabularyAvg,
            ["taskAchievement"]  = scores.TaskAchievementAvg,
        };

        var strongest = skillMap.MaxBy(kv => kv.Value).Key;
        var weakest   = skillMap.MinBy(kv => kv.Value).Key;

        return new OPICLevelEngineResult(level, overall, strongest, weakest);
    }

    /// <summary>
    /// Caps the result level based on selected exam difficulty.
    /// Students who chose difficulty 1–2 get capped at IM2.
    /// Only difficulty 5–6 unlocks IH and AL.
    /// </summary>
    private static string ApplyDifficultyCap(string level, int? chosenDifficulty)
    {
        if (chosenDifficulty is null) return level;

        return chosenDifficulty switch
        {
            <= 2 => CapAt(level, "IM2"),
            <= 4 => CapAt(level, "IH"),
            _    => level,
        };
    }

    private static string CapAt(string level, string maxLevel)
    {
        // Level order from lowest to highest
        string[] order = ["NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];
        int current = Array.IndexOf(order, level);
        int max     = Array.IndexOf(order, maxLevel);
        return current > max ? order[max] : level;
    }

    /// <summary>
    /// Build improvement advice text based on weakest skill.
    /// </summary>
    public static string BuildImprovementAdvice(string weakestSkill, string assignedLevel) =>
        weakestSkill switch
        {
            "pronunciation"   => $"Tập trung luyện phát âm — nghe lại recording và so sánh với người bản ngữ. Mục tiêu tiếp theo từ {assignedLevel}.",
            "fluency"         => $"Luyện nói liên tục không ngừng — tránh dừng lâu và từ đệm (uh, um). Đặt mục tiêu {assignedLevel} → level cao hơn.",
            "coherence"       => $"Xây dựng câu trả lời có cấu trúc: Mở - Thân - Kết. Dùng từ nối (firstly, however, therefore).",
            "vocabulary"      => $"Mở rộng từ vựng theo chủ đề OPIC (travel, job, hobbies). Học collocations thay vì từ đơn lẻ.",
            "taskAchievement" => $"Chú ý trả lời đúng loại câu hỏi: miêu tả → dùng tính từ; kinh nghiệm → dùng thì quá khứ; role-play → đúng vai.",
            _                 => $"Tiếp tục luyện tập đều đặn để cải thiện từ mức {assignedLevel}.",
        };
}
