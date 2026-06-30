namespace ExpTracker.Core.Models.Dtos;

public record HealthResponse(
    string Status,
    string Db,
    string S3);
