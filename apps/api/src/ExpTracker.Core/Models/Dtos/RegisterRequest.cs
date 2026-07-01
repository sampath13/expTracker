namespace ExpTracker.Core.Models.Dtos;

public record RegisterRequest(
    string Email,
    string Password,
    string Mobile,
    bool CommunityContribution = true);