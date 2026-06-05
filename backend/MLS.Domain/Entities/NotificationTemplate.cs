namespace MLS.Domain.Entities;

public class NotificationTemplate
{
    public string Key { get; set; } = string.Empty;     // e.g. "course_enrolled"
    public string Locale { get; set; } = string.Empty;  // "vi" | "en" | "ko"
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;    // Handlebars: {{courseName}}
}
