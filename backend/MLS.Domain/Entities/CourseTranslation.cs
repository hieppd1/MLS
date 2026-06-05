namespace MLS.Domain.Entities;

public class CourseTranslation
{
    public Guid CourseId { get; set; }
    public string Locale { get; set; } = string.Empty;   // "vi" | "en" | "ko"
    public string? Title { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Outcomes { get; set; }
    public string? Requirements { get; set; }
    public string? TargetAudience { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Course? Course { get; set; }
}
