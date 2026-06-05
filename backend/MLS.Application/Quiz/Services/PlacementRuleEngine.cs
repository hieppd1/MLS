using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Services;

/// <summary>
/// Determines placement level (1–6) from skill-segmented attempt answers.
/// Skill scores are percentages (0–100). Level rules are applied in order.
/// </summary>
public static class PlacementRuleEngine
{
    public static (int Level, Dictionary<string, decimal> SkillBreakdown) Determine(
        IReadOnlyList<AttemptAnswer> answers,
        IReadOnlyList<Domain.Entities.Question> questions)
    {
        // Group answers by SkillType → compute percentage per skill
        var skillScores = new Dictionary<string, (decimal earned, decimal total)>();

        foreach (var answer in answers)
        {
            var question = questions.FirstOrDefault(q => q.Id == answer.QuestionId);
            if (question == null) continue;

            var skillKey = question.SkillType.ToString();
            var maxScore = answer.Score.HasValue ? question.DefaultScore : question.DefaultScore;

            if (!skillScores.ContainsKey(skillKey))
                skillScores[skillKey] = (0m, 0m);

            var earned = answer.IsCorrect == true ? (answer.Score ?? question.DefaultScore) : 0m;
            skillScores[skillKey] = (skillScores[skillKey].earned + earned,
                                     skillScores[skillKey].total  + question.DefaultScore);
        }

        var breakdown = skillScores.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.total > 0
                ? Math.Round(kv.Value.earned / kv.Value.total * 100m, 1)
                : 0m);

        // Overall average
        var overallAvg = breakdown.Count > 0
            ? Math.Round(breakdown.Values.Average(), 1)
            : 0m;

        // Primary level rule (based on overall %)
        var level = overallAvg switch
        {
            >= 85m => 6,
            >= 70m => 5,
            >= 55m => 4,
            >= 40m => 3,
            >= 25m => 2,
            _      => 1
        };

        // Skill-specific adjustments — cap at maximum 1 level reduction (Y6 fix)
        int adjustments = 0;
        if (breakdown.TryGetValue("Listening", out var listenPct) && listenPct < 30m && level >= 4)
            adjustments++;
        if (breakdown.TryGetValue("Grammar", out var grammarPct) && grammarPct < 30m && level >= 4)
            adjustments++;
        level -= Math.Min(1, adjustments);  // never reduce by more than 1 level

        level = Math.Clamp(level, 1, 6);
        return (level, breakdown);
    }
}
