using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Services;

/// <summary>
/// Auto-grades objective question types: SingleChoice, MultipleChoice, TrueFalse, FillBlank.
/// Returns (isCorrect, score) tuple. Score is proportional for MultipleChoice.
/// </summary>
public static class AutoGraderService
{
    public static (bool IsCorrect, decimal Score) Grade(
        Domain.Entities.Question question,
        IReadOnlyList<QuestionOption> options,
        string? answerValue,
        decimal maxScore)
    {
        if (string.IsNullOrWhiteSpace(answerValue))
            return (false, 0m);

        return question.Type switch
        {
            QuestionType.SingleChoice   => GradeSingleChoice(options, answerValue, maxScore),
            QuestionType.TrueFalse      => GradeTrueFalse(options, answerValue, maxScore),
            QuestionType.MultipleChoice => GradeMultipleChoice(options, answerValue, maxScore),
            QuestionType.FillBlank      => GradeFillBlank(options, answerValue, maxScore),
            QuestionType.Matching       => GradeMatching(options, answerValue, maxScore),
            QuestionType.Ordering       => GradeOrdering(options, answerValue, maxScore),
            _                           => (false, 0m) // Speaking/Writing graded by AI
        };
    }

    // ── Single Choice ─────────────────────────────────────────────────────────
    private static (bool, decimal) GradeSingleChoice(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        var correct = options.FirstOrDefault(o => o.IsCorrect);
        if (correct == null) return (false, 0m);

        // answerValue = selected option ID
        if (!Guid.TryParse(answerValue, out var selectedId))
            return (false, 0m);

        var isCorrect = selectedId == correct.Id;
        return (isCorrect, isCorrect ? maxScore : 0m);
    }

    // ── True / False ──────────────────────────────────────────────────────────
    private static (bool, decimal) GradeTrueFalse(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        var normalised = answerValue.Trim().ToLowerInvariant();
        // answerValue may be "true"/"false" or option ID
        if (Guid.TryParse(answerValue, out var selectedId))
        {
            var opt = options.FirstOrDefault(o => o.Id == selectedId);
            if (opt == null) return (false, 0m);
            return (opt.IsCorrect, opt.IsCorrect ? maxScore : 0m);
        }

        // Plain text "true"/"false" — match against option content
        var correctOpt = options.FirstOrDefault(o => o.IsCorrect);
        if (correctOpt == null) return (false, 0m);
        var correctNorm = correctOpt.Content.Trim().ToLowerInvariant();
        var isCorrect = correctNorm == normalised;
        return (isCorrect, isCorrect ? maxScore : 0m);
    }

    // ── Multiple Choice ───────────────────────────────────────────────────────
    private static (bool, decimal) GradeMultipleChoice(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        // answerValue = comma-separated option IDs
        var selectedIds = answerValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Guid.TryParse(s.Trim(), out var g) ? (Guid?)g : null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToHashSet();

        var correctIds = options.Where(o => o.IsCorrect).Select(o => o.Id).ToHashSet();

        // Any wrong selection → score 0
        var wrongHit = selectedIds.Except(correctIds).Any();
        if (wrongHit) return (false, 0m);

        if (correctIds.Count == 0) return (false, 0m);

        var correctHit = selectedIds.Intersect(correctIds).Count();
        var proportion = (decimal)correctHit / correctIds.Count;
        var score = Math.Round(proportion * maxScore, 2);
        return (proportion == 1m, score);
    }

    // ── Fill Blank ────────────────────────────────────────────────────────────
    private static (bool, decimal) GradeFillBlank(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        // Correct answer stored in first option's Content
        var correct = options.FirstOrDefault(o => o.IsCorrect);
        if (correct == null) return (false, 0m);

        var normalAnswer  = Normalise(answerValue);
        var normalCorrect = Normalise(correct.Content);

        // Exact match
        if (normalAnswer == normalCorrect) return (true, maxScore);

        // Fuzzy: Levenshtein distance ≤ 1 for short words, ≤ 2 for longer
        var threshold = normalCorrect.Length <= 4 ? 0 : (normalCorrect.Length <= 8 ? 1 : 2);
        if (LevenshteinDistance(normalAnswer, normalCorrect) <= threshold)
            return (true, maxScore);

        return (false, 0m);
    }

    private static string Normalise(string s)
        => s.Trim().ToLowerInvariant()
             .Replace("\u2018", "'").Replace("\u2019", "'").Replace("\"", "");

    // ── Matching ──────────────────────────────────────────────────────────────
    // AnswerValue JSON: [{"key":"A","value":"Dog"},{"key":"B","value":"Cat"}]
    private static (bool, decimal) GradeMatching(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        try
        {
            var studentPairs = System.Text.Json.JsonSerializer.Deserialize<List<MatchPair>>(answerValue);
            if (studentPairs == null || studentPairs.Count == 0) return (false, 0m);

            var correctPairs = options
                .Where(o => o.MatchKey != null && o.MatchValue != null)
                .ToDictionary(o => o.MatchKey!, o => o.MatchValue!);

            if (correctPairs.Count == 0) return (false, 0m);

            int correctCount = studentPairs.Count(p =>
                correctPairs.TryGetValue(p.Key, out var expected) &&
                string.Equals(expected.Trim(), p.Value.Trim(), StringComparison.OrdinalIgnoreCase));

            var proportion = (decimal)correctCount / correctPairs.Count;
            return (correctCount == correctPairs.Count, Math.Round(proportion * maxScore, 2));
        }
        catch { return (false, 0m); }
    }

    private record MatchPair(string Key, string Value);

    // ── Ordering ──────────────────────────────────────────────────────────────
    // AnswerValue JSON: ["optId3","optId1","optId2"] — student's submitted order
    private static (bool, decimal) GradeOrdering(
        IReadOnlyList<QuestionOption> options, string answerValue, decimal maxScore)
    {
        try
        {
            var studentOrder = System.Text.Json.JsonSerializer.Deserialize<List<string>>(answerValue);
            if (studentOrder == null || studentOrder.Count == 0) return (false, 0m);

            var correctOrder = options
                .OrderBy(o => o.DisplayOrder)
                .Select(o => o.Id.ToString())
                .ToList();

            if (correctOrder.Count == 0) return (false, 0m);

            bool perfectOrder = studentOrder.SequenceEqual(correctOrder);

            // Partial: count positions that are correct
            int correctPositions = studentOrder
                .Zip(correctOrder, (s, c) => s == c)
                .Count(x => x);

            var proportion = (decimal)correctPositions / correctOrder.Count;
            return (perfectOrder, Math.Round(proportion * maxScore, 2));
        }
        catch { return (false, 0m); }
    }

    private static int LevenshteinDistance(string a, string b)
    {
        var n = a.Length;
        var m = b.Length;
        var dp = new int[n + 1, m + 1];
        for (var i = 0; i <= n; i++) dp[i, 0] = i;
        for (var j = 0; j <= m; j++) dp[0, j] = j;
        for (var i = 1; i <= n; i++)
        for (var j = 1; j <= m; j++)
        {
            var cost = a[i - 1] == b[j - 1] ? 0 : 1;
            dp[i, j] = Math.Min(
                Math.Min(dp[i - 1, j] + 1, dp[i, j - 1] + 1),
                dp[i - 1, j - 1] + cost);
        }
        return dp[n, m];
    }
}
