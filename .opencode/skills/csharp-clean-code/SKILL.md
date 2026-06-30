---
name: csharp-clean-code
description: Use when writing C# code in the .NET backend (apps/api/). Enforces naming conventions, project-layer separation, async patterns, DI patterns, error handling with Result types, EF Core usage, and .NET 10 idioms. Use for all C# code in the ExpTracker solution.
---

# C# Clean Code — expTracker

Applies to: `apps/api/` — the `ExpTracker.Api`, `ExpTracker.Core`, `ExpTracker.Infrastructure` 3-tier solution.

## Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Class / Record | PascalCase | `BillsController`, `PriceLookupService` |
| Interface | `I` + PascalCase | `IS3Service`, `ITokenService` |
| Method | PascalCase (async suffix `Async`) | `GetBillsAsync`, `ConfirmBillAsync` |
| Property | PascalCase | `Total`, `ConfirmedAt` |
| Private field | `_camelCase` | `_dateTimeProvider`, `_context` |
| Local variable | camelCase | `billId`, `userEmail` |
| Constant | PascalCase | `MaxScanLimit` |
| Enum member | PascalCase | `ConfidenceTier.High` |
| DTO class | PascalCase, descriptive suffix | `BillResponse`, `ConfirmRequest` |
| EF config class | `{Entity}Configuration` | `BillConfiguration` |

## Project-Layer Rules (enforced by `dotnet-solution-structure`)

```
ExpTracker.Api         → Controllers, middleware, Program.cs
ExpTracker.Core        → Services, DTOs, interfaces (zero project references)
ExpTracker.Infrastructure → DbContexts, EF configs, S3, JWT, external services

Dependency: Api → Core, Api → Infrastructure, Infrastructure → Core
            Core → (nothing)
```

## Async Patterns

```csharp
// ✅ Always use async/await with CancellationToken
public async Task<Result<IReadOnlyList<BillResponse>>> GetBillsAsync(
    Guid userId,
    Guid? afterId = null,
    int pageSize = 20,
    CancellationToken cancellationToken = default)
{
    var bills = await _context.Bills
        .Where(b => b.UserId == userId && !b.IsDeleted)
        .OrderByDescending(b => b.ConfirmedAt)
        .Take(pageSize)
        .ToListAsync(cancellationToken);

    return Result.Success(bills.Select(MapToResponse).ToList());
}

// ❌ Avoid: sync-over-async
// var bills = _context.Bills.Where(...).ToList();  ← blocks thread, no cancellation

// ❌ Avoid: missing CancellationToken
// public Task<Result> DoWorkAsync()  ← add CancellationToken parameter

// ❌ Avoid: async void (except for event handlers)
// public async void HandleEvent()  ← use async Task
```

## Dependency Injection

```csharp
// ✅ Constructor injection — no service locator
public class BillsController : ControllerBase
{
    private readonly IBillService _billService;
    private readonly ILogger<BillsController> _logger;

    public BillsController(IBillService billService, ILogger<BillsController> logger)
    {
        _billService = billService;
        _logger = logger;
    }
}

// ✅ Extension methods per project for registration
// ExpTracker.Core/DependencyInjection.cs
public static IServiceCollection AddCore(this IServiceCollection services)
{
    services.AddScoped<IPriceLookupService, PriceLookupService>();
    return services;
}

// ❌ Avoid: Service Locator pattern
// var service = HttpContext.RequestServices.GetService<IBillService>();  ← NO

// ❌ Avoid: injecting DbContext into controllers
// Use it only through services in Core layer
```

## Error Handling

```csharp
// ✅ Use Result pattern for business errors (not exceptions)
public async Task<Result<BillDto>> GetBillAsync(Guid billId, Guid userId)
{
    var bill = await _context.Bills
        .FirstOrDefaultAsync(b => b.Id == billId && b.UserId == userId);

    if (bill is null)
        return Result.Failure<BillDto>(BillErrors.NotFound(billId));

    return Result.Success(MapToDto(bill));
}

// Controller: pattern-match the Result
[HttpGet("{id}")]
public async Task<ActionResult<BillDto>> GetBill(Guid id)
{
    var result = await _billService.GetBillAsync(id, GetUserId());
    return result.IsSuccess
        ? Ok(result.Value)
        : result.Error.Code switch
        {
            "Bill.NotFound" => NotFound(result.Error.Description),
            _ => StatusCode(500, result.Error.Description)
        };
}

// ❌ Avoid: throwing exceptions for business logic
// if (bill is null) throw new NotFoundException(...);  ← use Result pattern
```

## EF Core Patterns

```csharp
// ✅ Fluent API configuration in separate classes
// ExpTracker.Infrastructure/Configurations/BillConfiguration.cs
public class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.ToTable("bills");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Total)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(b => b.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.ConfirmedAt);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

// ✅ Async queries with projection (no tracking for reads)
public async Task<BillDto?> GetByIdAsync(Guid id, CancellationToken ct)
{
    return await _context.Bills
        .AsNoTracking()
        .Where(b => b.Id == id)
        .Select(b => new BillDto(b.Id, b.Total, b.ConfirmedAt))
        .FirstOrDefaultAsync(ct);
}

// ❌ Avoid: tracking queries for read-only data
// _context.Bills.FirstOrDefaultAsync(...)  ← add AsNoTracking()

// ❌ Avoid: client-side evaluation
// _context.Bills.Where(b => SomeComplexCheck(b)).ToListAsync()
// EF can't translate SomeComplexCheck to SQL
```

## Attribute Patterns

```csharp
// ✅ [Authorize] on all non-auth endpoints
[Authorize]
[ApiController]
[Route("bills")]
public class BillsController : ControllerBase { }

// ✅ ClaimsPrincipal extension for user ID
public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token");
        return Guid.Parse(claim.Value);
    }
}

// ✅ FluentValidation for request validation
public class ConfirmBillRequestValidator : AbstractValidator<ConfirmBillRequest>
{
    public ConfirmBillRequestValidator()
    {
        RuleFor(x => x.ObjectKey).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new ConfirmItemValidator());
    }
}
```

## Avoid

| Don't | Do |
|---|---|
| `var` when type is not obvious | Explicit type if >2 lines from initialization |
| Magic strings/numbers | Constants or enums |
| `throw` for business errors | `Result.Failure(Error)` |
| `DateTime.Now` | `DateTime.UtcNow` or inject `IDateTimeProvider` |
| `IEnumerable` for DB queries | `IReadOnlyList` or `IReadOnlyCollection` (materialized) |
| `First()` or `Single()` | `FirstOrDefault()` or `SingleOrDefault()` with null check |
| String concatenation for SQL | EF Core LINQ or parameterized queries |
| `async void` | `async Task` (or `async void` only for event handlers) |
| Hardcoded connection strings | `appsettings.json` + `IOptions<T>` |
| Console.WriteLine | `ILogger<T>` with structured logging |
| Regions (`#region`) | Well-named, small files (no regions needed) |
| Public setters on entities | Private setters with factory methods |
| `[FromServices]` in action params | Constructor injection |
