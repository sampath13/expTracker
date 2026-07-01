namespace ExpTracker.Core.Models;

public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public Error? Error { get; }

    protected Result(bool isSuccess, Error? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, null);

    public static Result<T> Success<T>(T value) => new(value, true, null);

    public static Result Failure(Error error) => new(false, error);

    public static Result<T> Failure<T>(Error error) => new(default, false, error);
}

public class Result<T> : Result
{
    public T? Value { get; }

    public Result(T? value, bool isSuccess, Error? error)
        : base(isSuccess, error)
    {
        Value = value;
    }
}

public record Error(string Code, string Description)
{
    public static readonly Error None = new(string.Empty, string.Empty);

    public static Error Conflict(string description) =>
        new("Conflict", description);

    public static Error Validation(string description) =>
        new("Validation", description);

    public static Error NotFound(string description) =>
        new("NotFound", description);

    public static Error Unauthorized(string description) =>
        new("Unauthorized", description);
}