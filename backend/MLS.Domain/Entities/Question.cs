using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public enum QuestionType
{
    // Phase 3A — basic
    SingleChoice, MultipleChoice, TrueFalse, FillBlank, Matching, Ordering,
    // Phase 3B — AI graded
    SpeakingRecording, EssayWriting,
    // Phase 3A — media
    VideoQuiz, DragDrop, AudioTranscription,
    // Phase 3.2 — OPIC
    OPICRolePlay, OPICQuestionAsking,
    // Phase 3.3 — VSTEP
    AudioListeningMCQ, SolutionDiscussion, TopicDevelopment,
    LetterWriting, EssayWritingVSTEP
}
public enum DifficultyLevel { Easy, Medium, Hard }

public class Question : BaseEntity
{
    public string          Content      { get; private set; } = string.Empty;
    public string?         AudioUrl     { get; private set; }
    public string?         ImageUrl     { get; private set; }
    public string?         VideoUrl     { get; private set; }
    public QuestionType    Type         { get; private set; } = QuestionType.SingleChoice;
    public SkillType       SkillType    { get; private set; } = SkillType.Mixed;
    public DifficultyLevel Difficulty   { get; private set; } = DifficultyLevel.Medium;
    public string?         Explanation  { get; private set; }
    public decimal         DefaultScore { get; private set; } = 1m;
    public string?         Tags         { get; private set; }  // JSON array e.g. ["IELTS","grammar"]
    public bool            IsPublic             { get; private set; }
    public bool            IsDeleted            { get; private set; }   // soft delete
    public DateTime?       DeletedAt            { get; private set; }
    public Guid            CreatedBy            { get; private set; }
    // Phase 3B — Speaking / OPIC / VSTEP
    public int?            AudioPlayLimit       { get; private set; }  // max listen count (OPIC:2, VSTEP:2)
    public int?            SpeakingTimeLimitSec { get; private set; }
    public string?         ReferenceText        { get; private set; }
    public string?         ExamModeTag          { get; private set; }

    // Navigation
    public ICollection<QuestionOption> Options   { get; private set; } = [];
    public ICollection<QuizQuestion>   QuizLinks { get; private set; } = [];

    private Question() { }

    public static Question Create(
        string content,
        Guid createdBy,
        QuestionType type           = QuestionType.SingleChoice,
        SkillType skillType         = SkillType.Mixed,
        DifficultyLevel difficulty  = DifficultyLevel.Medium,
        decimal defaultScore        = 1m,
        string? explanation         = null,
        string? audioUrl            = null,
        string? imageUrl            = null,
        string? videoUrl            = null,
        string? tags                = null,
        bool isPublic               = false) => new()
    {
        Id           = Guid.NewGuid(),
        Content      = content.Trim(),
        Type         = type,
        SkillType    = skillType,
        Difficulty   = difficulty,
        DefaultScore = defaultScore,
        Explanation  = explanation?.Trim(),
        AudioUrl     = audioUrl?.Trim(),
        ImageUrl     = imageUrl?.Trim(),
        VideoUrl     = videoUrl?.Trim(),
        Tags         = tags,
        IsPublic     = isPublic,
        CreatedBy    = createdBy,
        CreatedAt    = DateTime.UtcNow,
    };

    public void Update(
        string content,
        QuestionType type,
        SkillType skillType,
        DifficultyLevel difficulty,
        decimal defaultScore,
        string? explanation,
        string? audioUrl,
        string? imageUrl,
        string? videoUrl,
        string? tags,
        bool isPublic,
        int? audioPlayLimit         = null,
        int? speakingTimeLimitSec   = null,
        string? examModeTag         = null)
    {
        Content              = content.Trim();
        Type                 = type;
        SkillType            = skillType;
        Difficulty           = difficulty;
        DefaultScore         = defaultScore;
        Explanation          = explanation?.Trim();
        AudioUrl             = audioUrl?.Trim();
        ImageUrl             = imageUrl?.Trim();
        VideoUrl             = videoUrl?.Trim();
        Tags                 = tags;
        IsPublic             = isPublic;
        AudioPlayLimit       = audioPlayLimit;
        SpeakingTimeLimitSec = speakingTimeLimitSec;
        ExamModeTag          = examModeTag?.Trim();
        SetUpdatedAt();
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }
}
