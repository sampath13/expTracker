namespace ExpTracker.Core.Models.Dtos;

public record BillResponse(
    Guid Id,
    decimal Total,
    DateTime ConfirmedAt);
