using MLS.Domain.Common;

namespace MLS.Domain.Entities;

/// <summary>
/// Configurable quiz type entry per exam mode.
/// Admins/teachers can add custom types beyond the built-in enum defaults.
/// </summary>
public class QuizTypeConfig : BaseEntity
{
    public string ExamMode  { get; private set; } = "Standard"; // Standard | OPIC | VSTEP
    public string Value     { get; private set; } = string.Empty; // enum-style key, e.g. "PracticeQuiz"
    public string Label     { get; private set; } = string.Empty; // Vietnamese display, e.g. "Luyện tập"
    public int    SortOrder { get; private set; }
    public bool   IsActive  { get; private set; } = true;

    private QuizTypeConfig() { }

    public static QuizTypeConfig Create(string examMode, string value, string label, int sortOrder = 0)
        => new()
        {
            ExamMode  = examMode.Trim(),
            Value     = value.Trim(),
            Label     = label.Trim(),
            SortOrder = sortOrder,
            IsActive  = true,
        };

    public void Update(string label, int sortOrder, bool isActive)
    {
        Label     = label.Trim();
        SortOrder = sortOrder;
        IsActive  = isActive;
        SetUpdatedAt();
    }
}
