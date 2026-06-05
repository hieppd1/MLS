using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum ExamMode { Standard, OPIC, VSTEP }

public enum QuizType
{
    PlacementTest, SegmentQuiz, PracticeQuiz, MockTest,
    AdaptiveQuiz, SpeakingTest, WritingTest,
    GrammarQuiz, VocabularyQuiz, RealtimeQuiz,
    // Phase 3.2 — OPIC
    OPICMockTest, OPICMiniTest,
    // Phase 3.3 — VSTEP
    VSTEPMockTest, VSTEPListening, VSTEPReading, VSTEPWriting, VSTEPSpeaking
}
public enum SkillType   { Listening, Speaking, Reading, Writing, Grammar, Vocabulary, Mixed }
public enum QuizStatus  { Draft, Published, Archived }

public class Quiz : BaseEntity
{
    public string     Title                { get; private set; } = string.Empty;
    public string?    Description          { get; private set; }
    public QuizType   QuizType             { get; private set; } = QuizType.PracticeQuiz;
    public SkillType  SkillType            { get; private set; } = SkillType.Mixed;
    public QuizStatus Status               { get; private set; } = QuizStatus.Draft;
    public int        Level                { get; private set; } = 1;
    public int?       Duration             { get; private set; }   // giây
    public decimal    TotalScore           { get; private set; } = 10m;
    public decimal    PassingScore         { get; private set; } = 7m;
    public bool       RandomQuestion       { get; private set; }
    public bool       RandomAnswer         { get; private set; }
    public bool       AllowRetry           { get; private set; } = true;
    public int?       RetryLimit           { get; private set; }
    public bool       ShowCorrectAnswer    { get; private set; } = true;
    public bool       ShowExplanation      { get; private set; } = true;
    public Guid       CreatedBy            { get; private set; }
    public Guid?      CourseId             { get; private set; }
    public Guid?      SessionId            { get; private set; }
    public int?       VideoTriggerSecond   { get; private set; }
    public ExamMode   ExamMode             { get; private set; } = ExamMode.Standard;
    public string     Language             { get; private set; } = "vi";

    // Navigation
    public ICollection<QuizQuestion>  Questions { get; private set; } = [];
    public ICollection<QuizAttempt>   Attempts  { get; private set; } = [];

    private Quiz() { }

    public static Quiz Create(
        string title,
        Guid createdBy,
        QuizType quizType       = QuizType.PracticeQuiz,
        SkillType skillType     = SkillType.Mixed,
        int level               = 1,
        int? duration           = null,
        decimal totalScore      = 10m,
        decimal passingScore    = 7m,
        bool allowRetry         = true,
        int? retryLimit         = null,
        bool randomQuestion     = false,
        bool randomAnswer       = false,
        bool showCorrectAnswer  = true,
        bool showExplanation    = true,
        string? description     = null,
        Guid? courseId          = null,
        Guid? sessionId         = null,
        int? videoTriggerSecond = null,
        ExamMode examMode       = ExamMode.Standard) => new()
    {
        Id                  = Guid.NewGuid(),
        Title               = title.Trim(),
        Description         = description?.Trim(),
        QuizType            = quizType,
        SkillType           = skillType,
        ExamMode            = examMode,
        Status              = QuizStatus.Draft,
        Level               = level,
        Duration            = duration,
        TotalScore          = totalScore,
        PassingScore        = passingScore,
        AllowRetry          = allowRetry,
        RetryLimit          = retryLimit,
        RandomQuestion      = randomQuestion,
        RandomAnswer        = randomAnswer,
        ShowCorrectAnswer   = showCorrectAnswer,
        ShowExplanation     = showExplanation,
        CreatedBy           = createdBy,
        CourseId            = courseId,
        SessionId           = sessionId,
        VideoTriggerSecond  = videoTriggerSecond,
        CreatedAt           = DateTime.UtcNow,
    };

    public void Update(
        string title,
        string? description,
        int level,
        int? duration,
        decimal totalScore,
        decimal passingScore,
        bool allowRetry,
        int? retryLimit,
        bool randomQuestion,
        bool randomAnswer,
        bool showCorrectAnswer,
        bool showExplanation,
        Guid? courseId,
        Guid? sessionId,
        int? videoTriggerSecond)
    {
        Title               = title.Trim();
        Description         = description?.Trim();
        Level               = level;
        Duration            = duration;
        TotalScore          = totalScore;
        PassingScore        = passingScore;
        AllowRetry          = allowRetry;
        RetryLimit          = retryLimit;
        RandomQuestion      = randomQuestion;
        RandomAnswer        = randomAnswer;
        ShowCorrectAnswer   = showCorrectAnswer;
        ShowExplanation     = showExplanation;
        CourseId            = courseId;
        SessionId           = sessionId;
        VideoTriggerSecond  = videoTriggerSecond;
        SetUpdatedAt();
    }

    public void Publish()
    {
        Status = QuizStatus.Published;
        SetUpdatedAt();
    }

    public void Archive()
    {
        Status = QuizStatus.Archived;
        SetUpdatedAt();
    }
}
