using MLS.Domain.Common;

namespace MLS.Domain.Entities;

public class BookCategory : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int SortOrder { get; private set; }

    public ICollection<Book> Books { get; private set; } = [];

    private BookCategory() { }

    public static BookCategory Create(string name, string? description = null, int sortOrder = 0)
        => new()
        {
            Name = name.Trim(),
            Slug = GenerateSlug(name),
            Description = description?.Trim(),
            SortOrder = sortOrder,
        };

    private static string GenerateSlug(string name)
    {
        var slug = name.Trim().ToLower()
            .Replace(" ", "-")
            .Replace("đ", "d");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');
        return slug.Length > 0 ? slug : Guid.NewGuid().ToString("N")[..8];
    }

    public void Update(string name, string? description, int sortOrder)
    {
        Name = name.Trim();
        Description = description?.Trim();
        SortOrder = sortOrder;
        SetUpdatedAt();
    }
}
