using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.Quiz.Services;
using MLS.Domain.Entities;
using MLS.Domain.ValueObjects;
using QuizEntity = MLS.Domain.Entities.Quiz;

namespace MLS.Application.Quiz.Commands;

// ── Start Attempt ─────────────────────────────────────────────────────────────

public record StartAttemptCommand(Guid QuizId, Guid UserId) : IRequest<StartAttemptResult>;

public record StartAttemptResult(
    Guid AttemptId,
    List<AttemptQuestionDto> Questions,
    bool IsAdaptive = false,
    int MaxQuestions = 0);

public record AttemptQuestionDto(
    Guid QuestionId,
    string Content,
    string Type,
    string? AudioUrl,
    string? ImageUrl,
    int DisplayOrder,
    decimal Score,
    List<AttemptOptionDto> Options,
    int? SpeakingTimeLimitSec = null,
    string? ReferenceText = null,
    string? ExamModeTag = null);

public record AttemptOptionDto(Guid Id, string Content, int DisplayOrder, string? MatchKey, string? MatchValue);

public class StartAttemptHandler(IApplicationDbContext db)
    : IRequestHandler<StartAttemptCommand, StartAttemptResult>
{
    public async Task<StartAttemptResult> Handle(StartAttemptCommand cmd, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == cmd.QuizId, ct)
            ?? throw new InvalidOperationException("Quiz not found.");

        if (quiz.Status != QuizStatus.Published)
            throw new InvalidOperationException("Quiz is not published.");

        // R3: Idempotency — return existing InProgress attempt instead of creating duplicate
        var existing = await db.QuizAttempts
            .Include(a => a.Quiz)
            .FirstOrDefaultAsync(a => a.QuizId == cmd.QuizId
                                   && a.UserId == cmd.UserId
                                   && a.State == AttemptState.InProgress, ct);
        if (existing != null)
        {
            if (quiz.QuizType == QuizType.AdaptiveQuiz)
            {
                // Restore adaptive state and return current question
                var state = existing.GetAdaptiveState() ?? AdaptiveEngine.InitialState();
                var answeredSet = new HashSet<Guid>(state.Answers.Select(a => a.QuestionId));
                var difficulty  = Enum.TryParse<DifficultyLevel>(state.Difficulty, out var d) ? d : DifficultyLevel.Medium;
                var nextQ = await AdaptiveEngine.SelectNextQuestionAsync(
                    db.QuizQuestions.Where(qq => qq.QuizId == quiz.Id),
                    answeredSet, difficulty, quiz.SkillType, ct);
                var dtoList = nextQ == null
                    ? new List<AttemptQuestionDto>()
                    : new List<AttemptQuestionDto> { ToDto(nextQ, 1, 1m) };
                return new StartAttemptResult(existing.Id, dtoList, IsAdaptive: true, MaxQuestions: AdaptiveEngine.MaxQuestions);
            }

            // Re-use existing attempt: rebuild question list
            var existingQuizQuestions = quiz.Questions.ToList();
            if (quiz.RandomQuestion)
                existingQuizQuestions = [.. existingQuizQuestions.OrderBy(_ => Guid.NewGuid())];
            var existingDtos = existingQuizQuestions.Select(qq =>
            {
                var q = qq.Question;
                var opts = q.Options.ToList();
                return new AttemptQuestionDto(q.Id, q.Content, q.Type.ToString(),
                    q.AudioUrl, q.ImageUrl, qq.DisplayOrder, qq.Score,
                    opts.Select(o => new AttemptOptionDto(o.Id, o.Content, o.DisplayOrder, o.MatchKey, o.MatchValue)).ToList(),
                    q.SpeakingTimeLimitSec, q.ReferenceText, q.ExamModeTag);
            }).ToList();
            return new StartAttemptResult(existing.Id, existingDtos);
        }

        // Retry limit check
        if (quiz.RetryLimit.HasValue)
        {
            var previousAttempts = await db.QuizAttempts
                .CountAsync(a => a.QuizId == cmd.QuizId
                              && a.UserId == cmd.UserId
                              && a.State != AttemptState.Abandoned, ct);
            if (previousAttempts >= quiz.RetryLimit.Value)
                throw new InvalidOperationException("Retry limit reached.");
        }

        // Determine attempt number
        var attemptNumber = await db.QuizAttempts
            .CountAsync(a => a.QuizId == cmd.QuizId && a.UserId == cmd.UserId, ct) + 1;

        var attempt = QuizAttempt.Create(cmd.QuizId, cmd.UserId, attemptNumber,
            durationSeconds: quiz.Duration);
        db.QuizAttempts.Add(attempt);
        await db.SaveChangesAsync(ct);

        // ── Adaptive quiz: return only the first question ─────────────────────
        if (quiz.QuizType == QuizType.AdaptiveQuiz)
        {
            var initState   = AdaptiveEngine.InitialState();
            var initDiff    = DifficultyLevel.Medium;
            var firstQ      = await AdaptiveEngine.SelectNextQuestionAsync(
                db.QuizQuestions.Where(qq => qq.QuizId == quiz.Id),
                new HashSet<Guid>(), initDiff, quiz.SkillType, ct);

            attempt.SetAdaptiveState(initState);
            await db.SaveChangesAsync(ct);

            var firstDtos = firstQ == null
                ? new List<AttemptQuestionDto>()
                : new List<AttemptQuestionDto> { ToDto(firstQ, 1, firstQ.DefaultScore) };
            return new StartAttemptResult(attempt.Id, firstDtos, IsAdaptive: true, MaxQuestions: AdaptiveEngine.MaxQuestions);
        }

        // ── Standard quiz: return all questions ───────────────────────────────
        // Build question list (shuffle if configured)
        var quizQuestions = quiz.Questions.ToList();
        if (quiz.RandomQuestion)
            quizQuestions = [.. quizQuestions.OrderBy(_ => Guid.NewGuid())];

        var questionDtos = quizQuestions.Select(qq =>
        {
            var q = qq.Question;
            var opts = q.Options.ToList();
            if (quiz.RandomAnswer)
                opts = [.. opts.OrderBy(_ => Guid.NewGuid())];

            return new AttemptQuestionDto(
                q.Id, q.Content, q.Type.ToString(),
                q.AudioUrl, q.ImageUrl,
                qq.DisplayOrder, qq.Score,
                opts.Select(o => new AttemptOptionDto(o.Id, o.Content, o.DisplayOrder, o.MatchKey, o.MatchValue)).ToList(),
                q.SpeakingTimeLimitSec, q.ReferenceText, q.ExamModeTag
            );
        }).ToList();

        return new StartAttemptResult(attempt.Id, questionDtos);
    }

    private static AttemptQuestionDto ToDto(Question q, int displayOrder, decimal score)
    {
        var opts = q.Options.ToList();
        return new AttemptQuestionDto(
            q.Id, q.Content, q.Type.ToString(),
            q.AudioUrl, q.ImageUrl,
            displayOrder, score,
            opts.Select(o => new AttemptOptionDto(o.Id, o.Content, o.DisplayOrder, o.MatchKey, o.MatchValue)).ToList(),
            q.SpeakingTimeLimitSec, q.ReferenceText, q.ExamModeTag
        );
    }
}

// ── Save Answer ───────────────────────────────────────────────────────────────

public record SaveAnswerCommand(
    Guid AttemptId,
    Guid QuestionId,
    string? AnswerValue,
    string? AudioUrl  = null,
    string? EssayText = null,
    bool IsSkipped    = false
) : IRequest<SaveAnswerResult>;

/// <summary>
/// Result of saving an answer. For non-adaptive quizzes, only Success is populated.
/// For AdaptiveQuiz, includes correctness + next question info.
/// </summary>
public record SaveAnswerResult(
    bool Success,
    bool?              IsCorrect         = null,
    AttemptQuestionDto? NextQuestion     = null,
    string?            CurrentDifficulty = null,
    int                AnsweredCount     = 0,
    bool               IsComplete        = false
);

public class SaveAnswerHandler(IApplicationDbContext db)
    : IRequestHandler<SaveAnswerCommand, SaveAnswerResult>
{
    public async Task<SaveAnswerResult> Handle(SaveAnswerCommand cmd, CancellationToken ct)
    {
        var attempt = await db.QuizAttempts.FindAsync([cmd.AttemptId], ct);
        if (attempt == null || attempt.State != AttemptState.InProgress)
            return new SaveAnswerResult(false);

        // Load the quiz to determine type
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == attempt.QuizId, ct);

        if (quiz == null) return new SaveAnswerResult(false);

        // Save / update the answer
        var existing = await db.AttemptAnswers
            .FirstOrDefaultAsync(a => a.AttemptId == cmd.AttemptId && a.QuestionId == cmd.QuestionId, ct);

        if (existing != null)
            existing.UpdateAnswer(cmd.AnswerValue, cmd.AudioUrl, cmd.EssayText);
        else
            db.AttemptAnswers.Add(AttemptAnswer.Create(
                cmd.AttemptId, cmd.QuestionId,
                cmd.AnswerValue, cmd.AudioUrl, cmd.EssayText, cmd.IsSkipped));

        // ── Adaptive quiz: grade answer + select next question ────────────────
        if (quiz.QuizType == QuizType.AdaptiveQuiz)
            return await HandleAdaptiveAsync(attempt, quiz, cmd, ct);

        await db.SaveChangesAsync(ct);
        return new SaveAnswerResult(true);
    }

    private async Task<SaveAnswerResult> HandleAdaptiveAsync(
        QuizAttempt attempt, QuizEntity quiz, SaveAnswerCommand cmd, CancellationToken ct)
    {
        // Find the question + options to grade
        var qqLink = quiz.Questions.FirstOrDefault(qq => qq.QuestionId == cmd.QuestionId);
        var question = qqLink?.Question;

        bool isCorrect = false;
        if (question != null && !cmd.IsSkipped && cmd.AnswerValue != null)
        {
            var (correct, _) = AutoGraderService.Grade(
                question, question.Options.ToList(), cmd.AnswerValue, qqLink!.Score);
            isCorrect = correct;
        }

        // Load + update adaptive state
        var state = attempt.GetAdaptiveState() ?? AdaptiveEngine.InitialState();
        var prevDifficulty = Enum.TryParse<DifficultyLevel>(state.Difficulty, out var pd)
            ? pd : DifficultyLevel.Medium;

        state.Answers.Add(new AdaptiveAnswerEntry
        {
            QuestionId = cmd.QuestionId,
            IsCorrect  = isCorrect,
            Difficulty = state.Difficulty,
        });

        var newStreak     = AdaptiveEngine.CalculateNewStreak(isCorrect, state.Streak);
        var nextDifficulty = AdaptiveEngine.CalculateNextDifficulty(isCorrect, prevDifficulty, state.Streak);
        state.Streak      = newStreak;
        state.Difficulty  = nextDifficulty.ToString();
        state.Answered    = state.Answers.Count;

        var isComplete = AdaptiveEngine.ShouldStop(state.Answered, nextDifficulty, newStreak);

        attempt.SetAdaptiveState(state);
        await db.SaveChangesAsync(ct);

        if (isComplete)
        {
            return new SaveAnswerResult(
                true,
                IsCorrect:         isCorrect,
                CurrentDifficulty: nextDifficulty.ToString(),
                AnsweredCount:     state.Answered,
                IsComplete:        true);
        }

        // Select next question
        var answeredSet = new HashSet<Guid>(state.Answers.Select(a => a.QuestionId));
        var nextQ = await AdaptiveEngine.SelectNextQuestionAsync(
            db.QuizQuestions.Where(qq => qq.QuizId == quiz.Id),
            answeredSet, nextDifficulty, quiz.SkillType, ct);

        AttemptQuestionDto? nextDto = null;
        if (nextQ != null)
        {
            var opts = nextQ.Options.ToList();
            nextDto = new AttemptQuestionDto(
                nextQ.Id, nextQ.Content, nextQ.Type.ToString(),
                nextQ.AudioUrl, nextQ.ImageUrl,
                state.Answered + 1, 1m,
                opts.Select(o => new AttemptOptionDto(o.Id, o.Content, o.DisplayOrder, o.MatchKey, o.MatchValue)).ToList(),
                nextQ.SpeakingTimeLimitSec, nextQ.ReferenceText, nextQ.ExamModeTag);
        }

        return new SaveAnswerResult(
            true,
            IsCorrect:         isCorrect,
            NextQuestion:      nextDto,
            CurrentDifficulty: nextDifficulty.ToString(),
            AnsweredCount:     state.Answered,
            IsComplete:        nextDto == null); // exhausted pool
    }
}

// ── Submit Attempt ────────────────────────────────────────────────────────────

public record SubmitAttemptCommand(Guid AttemptId, int TimeTaken) : IRequest<SubmitAttemptResult>;

public record SubmitAttemptResult(decimal Score, decimal Percentage, bool Passed, bool HasManualGrading);

public class SubmitAttemptHandler(IApplicationDbContext db)
    : IRequestHandler<SubmitAttemptCommand, SubmitAttemptResult>
{
    public async Task<SubmitAttemptResult> Handle(SubmitAttemptCommand cmd, CancellationToken ct)
    {
        var attempt = await db.QuizAttempts
            .Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == cmd.AttemptId, ct)
            ?? throw new InvalidOperationException("Attempt not found.");

        if (attempt.State != AttemptState.InProgress)
        {
            // G6: Idempotent submit — return existing result instead of throwing
            return new SubmitAttemptResult(
                attempt.Score ?? 0m,
                attempt.Percentage ?? 0m,
                attempt.Passed,
                HasManualGrading: attempt.GradingMethod != GradingMethod.Auto);
        }

        // R2: Server-side timer enforcement
        if (attempt.ExpiresAt.HasValue && DateTime.UtcNow > attempt.ExpiresAt.Value.AddSeconds(30))
            throw new InvalidOperationException("Quiz session has expired.");

        attempt.Submit(cmd.TimeTaken);

        // Load quiz + questions + options
        var quiz = await db.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == attempt.QuizId, ct)
            ?? throw new InvalidOperationException("Quiz not found.");

        // ── Adaptive quiz: score from stored state ────────────────────────────
        if (quiz.QuizType == QuizType.AdaptiveQuiz)
        {
            var state = attempt.GetAdaptiveState();
            var adaptiveScore = state != null
                ? AdaptiveEngine.CalculateAdaptiveScore(state.Answers, quiz.TotalScore)
                : 0m;

            attempt.SetGrading();
            attempt.Grade(adaptiveScore, quiz.TotalScore, quiz.PassingScore);
            await db.SaveChangesAsync(ct);

            return new SubmitAttemptResult(
                adaptiveScore,
                attempt.Percentage ?? 0m,
                attempt.Passed,
                HasManualGrading: false);
        }

        // ── Standard quiz: grade each answer ─────────────────────────────────
        var quizQuestions = quiz.Questions.ToList();
        bool hasManualGrading = false;
        decimal earnedScore = 0m;

        foreach (var qq in quizQuestions)
        {
            var question = qq.Question;
            var answer = attempt.Answers.FirstOrDefault(a => a.QuestionId == question.Id);

            if (answer == null || answer.IsSkipped)
                continue;

            // Auto-gradeable types
            if (IsAutoGradable(question.Type))
            {
                var options = question.Options.ToList();
                var (isCorrect, score) = AutoGraderService.Grade(question, options, answer.AnswerValue, qq.Score);
                answer.SetGradeResult(isCorrect, score);
                earnedScore += score;
            }
            else
            {
                // Speaking, Writing, Ordering, Matching — require manual/AI grading
                hasManualGrading = true;
            }
        }

        var gradingMethod = hasManualGrading ? GradingMethod.AI : GradingMethod.Auto;
        attempt.SetGrading();

        if (!hasManualGrading)
            attempt.Grade(earnedScore, quiz.TotalScore, quiz.PassingScore);

        await db.SaveChangesAsync(ct);

        return new SubmitAttemptResult(
            attempt.Score ?? earnedScore,
            attempt.Percentage ?? Math.Round(earnedScore / quiz.TotalScore * 100m, 1),
            attempt.Passed,
            hasManualGrading);
    }

    private static bool IsAutoGradable(QuestionType type) => type
        is QuestionType.SingleChoice
        or QuestionType.MultipleChoice
        or QuestionType.TrueFalse
        or QuestionType.FillBlank
        or QuestionType.Matching
        or QuestionType.Ordering;
}

// ── Abandon Attempt ───────────────────────────────────────────────────────────

public record AbandonAttemptCommand(Guid AttemptId) : IRequest<bool>;

public class AbandonAttemptHandler(IApplicationDbContext db)
    : IRequestHandler<AbandonAttemptCommand, bool>
{
    public async Task<bool> Handle(AbandonAttemptCommand cmd, CancellationToken ct)
    {
        var attempt = await db.QuizAttempts.FindAsync([cmd.AttemptId], ct);
        if (attempt == null || attempt.State != AttemptState.InProgress)
            return false;
        attempt.Abandon();
        await db.SaveChangesAsync(ct);
        return true;
    }
}
