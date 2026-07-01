namespace ExpTracker.Core.Models.Dtos;

public record UpdateConsentRequest(
    bool? CommunityContribution = null,
    bool? MarketingOptIn = null);