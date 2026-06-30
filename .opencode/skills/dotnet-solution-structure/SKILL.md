---
name: dotnet-solution-structure
description: Use when creating the .NET solution structure, enforcing layer separation between Api/Core/Infrastructure projects, adding project references, setting up dependency injection per layer, or ensuring no dependency rule violations. Use ONLY for expTracker backend. Adapted from ronnythedev/dotnet-clean-architecture-skills.
source: https://github.com/ronnythedev/dotnet-clean-architecture-skills
version: 1.0.0
language: C#
framework: .NET 10
---

# .NET 3-Tier Solution Structure — expTracker

Enforces a strict 3-tier separation for the expTracker backend. Every new file must land in the correct project.

## Solution Layout

```
apps/api/
├── ExpTracker.sln
└── src/
    ├── ExpTracker.Api/                # Presentation layer
    │   ├── Controllers/
    │   │   ├── AuthController.cs
    │   │   ├── BillsController.cs
    │   │   └── CompareController.cs
    │   ├── Middleware/
    │   │   ├── JwtMiddleware.cs
    │   │   └── ErrorHandlingMiddleware.cs
    │   ├── Extensions/
    │   │   └── ServiceCollectionExtensions.cs
    │   ├── Program.cs
    │   ├── appsettings.json
    │   ├── appsettings.Development.json
    │   └── ExpTracker.Api.csproj
    │
    ├── ExpTracker.Core/               # Business logic + shared types
    │   ├── Services/
    │   │   ├── PriceLookupService.cs
    │   │   └── OcrOrchestrationService.cs
    │   ├── Models/
    │   │   ├── Dtos/
    │   │   └── Requests/
    │   ├── Interfaces/
    │   │   ├── ITokenService.cs
    │   │   ├── IS3Service.cs
    │   │   ├── IPriceLookupService.cs
    │   │   └── IOcrOrchestrationService.cs
    │   ├── DependencyInjection.cs
    │   └── ExpTracker.Core.csproj
    │
    └── ExpTracker.Infrastructure/     # Data access + external services
        ├── Data/
        │   ├── PersonalBillsDbContext.cs
        │   ├── ComparisonPoolDbContext.cs
        │   └── Migrations/
        ├── Services/
        │   ├── TokenService.cs
        │   ├── S3Service.cs
        │   └── GoogleAuthService.cs
        ├── Configurations/
        │   └── EntityConfigurations/    # EF Core Fluent API configs
        ├── DependencyInjection.cs
        └── ExpTracker.Infrastructure.csproj
```

## Dependency Rule (STRICT)

```
ExpTracker.Api ──────────────► ExpTracker.Core ──────────────► (none — leaf)
        │                              ▲
        └──────────► ExpTracker.Infrastructure
```

| Project | References | Must NOT contain |
|---|---|---|
| `ExpTracker.Core` | Nothing | EF Core, Npgsql, AWS SDK, controllers, Program.cs |
| `ExpTracker.Infrastructure` | `ExpTracker.Core` | Controllers, HTTP middleware, Swagger config |
| `ExpTracker.Api` | `ExpTracker.Core` + `ExpTracker.Infrastructure` | DbContext code, raw SQL, S3 SDK calls |

## Scaffold Commands

```bash
cd apps/api

# Create solution
dotnet new sln -n ExpTracker

# Create projects
dotnet new webapi -n ExpTracker.Api -o src/ExpTracker.Api
dotnet new classlib -n ExpTracker.Core -o src/ExpTracker.Core
dotnet new classlib -n ExpTracker.Infrastructure -o src/ExpTracker.Infrastructure

# Add to solution
dotnet sln add src/ExpTracker.Api/ExpTracker.Api.csproj
dotnet sln add src/ExpTracker.Core/ExpTracker.Core.csproj
dotnet sln add src/ExpTracker.Infrastructure/ExpTracker.Infrastructure.csproj

# Set up dependency chain
dotnet add src/ExpTracker.Infrastructure/ExpTracker.Infrastructure.csproj reference src/ExpTracker.Core/ExpTracker.Core.csproj
dotnet add src/ExpTracker.Api/ExpTracker.Api.csproj reference src/ExpTracker.Core/ExpTracker.Core.csproj
dotnet add src/ExpTracker.Api/ExpTracker.Api.csproj reference src/ExpTracker.Infrastructure/ExpTracker.Infrastructure.csproj
```

## Package Assignments

### ExpTracker.Core.csproj — no heavy deps
```xml
<ItemGroup>
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="10.*" />
</ItemGroup>
```

### ExpTracker.Infrastructure.csproj — all data + external
```xml
<ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.*" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.*" />
    <PackageReference Include="AWSSDK.S3" Version="3.*" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.*" />
    <PackageReference Include="Google.Apis.Auth" Version="1.*" />
    <ProjectReference Include="..\ExpTracker.Core\ExpTracker.Core.csproj" />
</ItemGroup>
```

### ExpTracker.Api.csproj — web framework only
```xml
<ItemGroup>
    <PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
    <PackageReference Include="Serilog.AspNetCore" Version="9.*" />
    <ProjectReference Include="..\ExpTracker.Core\ExpTracker.Core.csproj" />
    <ProjectReference Include="..\ExpTracker.Infrastructure\ExpTracker.Infrastructure.csproj" />
</ItemGroup>
```

## Dependency Injection (per-layer)

```csharp
// ExpTracker.Core/DependencyInjection.cs
public static IServiceCollection AddCore(this IServiceCollection services)
{
    services.AddScoped<IPriceLookupService, PriceLookupService>();
    services.AddScoped<IOcrOrchestrationService, OcrOrchestrationService>();
    return services;
}
```

```csharp
// ExpTracker.Infrastructure/DependencyInjection.cs
public static IServiceCollection AddInfrastructure(
    this IServiceCollection services, IConfiguration configuration)
{
    // DB
    services.AddDbContext<PersonalBillsDbContext>(options =>
        options.UseNpgsql(configuration.GetConnectionString("PersonalBills")));
    services.AddDbContext<ComparisonPoolDbContext>(options =>
        options.UseNpgsql(configuration.GetConnectionString("ComparisonPool")));

    // External services
    services.AddScoped<IS3Service, S3Service>();
    services.AddScoped<ITokenService, TokenService>();
    services.AddScoped<IGoogleAuthService, GoogleAuthService>();

    // Auth
    services.AddAuthentication(/* JWT config */);
    services.AddIdentityCore<User>(/* ... */);

    return services;
}
```

```csharp
// ExpTracker.Api/Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCore();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// ... middleware pipeline
app.Run();
```

## Critical Rules — Enforce During Development

1. **Core has ZERO project references** — no EF Core, no AWS SDK, no ASP.NET packages
2. **Infrastructure implements Core interfaces** — `IS3Service` in Core, `S3Service` in Infrastructure
3. **Api never touches DbContext directly** — always through Core service interfaces
4. **Controllers only at Api level** — if you find yourself adding `[ApiController]` in Core or Infrastructure, STOP
5. **One DI extension per project** — `AddCore()`, `AddInfrastructure()` called from Program.cs
6. **dbContext classes only in Infrastructure** — if a DbContext appears in Core, move it
7. **Migrations in Infrastructure/Data/Migrations/** — generated via Infrastructure project
8. **DTOs in Core/Models/Dtos/** — shared between Api and Infrastructure via Core

## Migration Commands (run from Infrastructure project)

```bash
cd src/ExpTracker.Infrastructure

# Personal Bills DB
dotnet ef migrations add InitialCreate --context PersonalBillsDbContext -o Data/Migrations/PersonalBills

# Comparison Pool DB
dotnet ef migrations add InitialCreate --context ComparisonPoolDbContext -o Data/Migrations/ComparisonPool

# Apply
dotnet ef database update --context PersonalBillsDbContext
dotnet ef database update --context ComparisonPoolDbContext
```

## When Adding a Feature — Layer Checklist

Ask these questions for every new file:

| Question | If answer is "Api" | If answer is "Core" | If answer is "Infrastructure" |
|---|---|---|---|
| Does it handle HTTP? | ✓ Ok | ✗ Wrong | ✗ Wrong |
| Does it contain business rules? | ✗ Move to Core | ✓ Ok | ✗ Move to Core |
| Does it touch the DB or S3? | ✗ Move to Infra | ✗ Move to Infra | ✓ Ok |
| Does it define an interface? | ✗ Move to Core | ✓ Ok | ✗ Move to Core |
| Is it a DTO? | (if response-only) | ✓ Ok | (is it an entity config?) |

## External Skill Reference

This skill is adapted from `ronnythedev/dotnet-clean-architecture-skills` (29 skills for .NET Clean Architecture, CQRS, DDD). Install the full pack with:

```bash
npx dotnet-clean-arch
```

Useful companion skills from that pack:
- `dotnet-ef-core-configuration` — Fluent API entity configs
- `dotnet-jwt-authentication` — JWT Bearer setup
- `dotnet-postgresql-best-practices` — Naming, indexing, xmin concurrency
- `dotnet-health-checks` — PostgreSQL + HTTP dependency monitoring
