using Microsoft.AspNetCore.Identity;

namespace ExpTracker.Core.Models.Entities;

public class User : IdentityUser<Guid>
{
    public string? Mobile { get; set; }

    public string? GoogleId { get; set; }

    public string Tier { get; set; } = "free";

    public bool CommunityContribution { get; set; } = true;

    public bool MarketingOptIn { get; set; }

    public int ScansThisMonth { get; set; }

    public DateTime? LastResetAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }
}
