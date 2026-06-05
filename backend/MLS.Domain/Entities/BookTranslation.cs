namespace MLS.Domain.Entities;

public class BookTranslation
{
    public Guid BookId { get; set; }
    public string Locale { get; set; } = string.Empty;   // "vi" | "en" | "ko"
    public string? Title { get; set; }
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Book? Book { get; set; }
}
