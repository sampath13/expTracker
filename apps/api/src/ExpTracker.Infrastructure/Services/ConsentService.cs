using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models;
using ExpTracker.Core.Models.Dtos;
using ExpTracker.Core.Models.Entities;
using ExpTracker.Infrastructure.Data;
using ExpTracker.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ExpTracker.Infrastructure.Services;

public class ConsentService : IConsentService
{
    private readonly PersonalBillsDbContext _context;

    public ConsentService(PersonalBillsDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ConsentResponse>> GetConsentAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return Result.Failure<ConsentResponse>(Error.NotFound("User not found"));
        }

        return Result.Success(new ConsentResponse(
            CommunityContribution: user.CommunityContribution,
            MarketingOptIn: user.MarketingOptIn));
    }

    public async Task<Result<ConsentResponse>> UpdateConsentAsync(Guid userId, UpdateConsentRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return Result.Failure<ConsentResponse>(Error.NotFound("User not found"));
        }

        if (request.CommunityContribution.HasValue)
        {
            var oldValue = user.CommunityContribution.ToString();
            user.CommunityContribution = request.CommunityContribution.Value;

            _context.ConsentAuditLogs.Add(new ConsentAuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Field = "CommunityContribution",
                OldValue = oldValue,
                NewValue = request.CommunityContribution.Value.ToString(),
                ChangedAt = DateTime.UtcNow,
            });
        }

        if (request.MarketingOptIn.HasValue)
        {
            var oldValue = user.MarketingOptIn.ToString();
            user.MarketingOptIn = request.MarketingOptIn.Value;

            _context.ConsentAuditLogs.Add(new ConsentAuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Field = "MarketingOptIn",
                OldValue = oldValue,
                NewValue = request.MarketingOptIn.Value.ToString(),
                ChangedAt = DateTime.UtcNow,
            });
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success(new ConsentResponse(
            CommunityContribution: user.CommunityContribution,
            MarketingOptIn: user.MarketingOptIn));
    }
}