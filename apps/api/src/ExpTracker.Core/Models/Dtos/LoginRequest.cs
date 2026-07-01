namespace ExpTracker.Core.Models.Dtos;

public record LoginRequest(
    string Email,
    string Password);