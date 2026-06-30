using ExpTracker.Core.Models.Entities;

namespace ExpTracker.Infrastructure.Data.Entities;

public class ConsentAuditLog
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Field { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
