---
name: dotnet-api
description: Use when creating or modifying .NET backend code in apps/api/, including controllers, services, EF Core models/migrations, JWT auth, ASP.NET Core Identity, middleware, S3 pre-signed URLs, or OCR orchestration. Use ONLY for the expTracker .NET backend.
---

# .NET Backend API — expTracker

## Tech Stack

| Concern | Technology |
|---|---|
| Runtime | .NET 10 LTS |
| Language | C# |
| Web framework | ASP.NET Core (controllers, not minimal APIs) |
| ORM | EF Core 10 + Npgsql (PostgreSQL) |
| Auth | ASP.NET Core Identity + JWT Bearer + Google external login |
| Token strategy | Short-lived access token (15 min) + refresh token rotation (30 day) |
| Cloud | AWS ap-southeast-1 (ECS Fargate for prod) |
| Dev storage | S3Ninja at localhost:9444 (zero AWS dependency) |

## Project Structure

The .NET backend is split into a **3-tier solution** (see `dotnet-solution-structure` skill for enforcement rules):

```
apps/api/
├── ExpTracker.sln
└── src/
    ├── ExpTracker.Api/                # Controllers + middleware (presentation)
    ├── ExpTracker.Core/               # Services + DTOs + interfaces (business logic)
    └── ExpTracker.Infrastructure/     # DbContexts + S3 + JWT (data + external)
```

**Dependency rule:** Api → Core ← Infrastructure. Core has zero project references. Infrastructure implements Core interfaces.

## Two DbContext Architecture

```
PersonalBillsDbContext     → PostgreSQL DB 1 (private, user-linked, PDPA-governed)
ComparisonPoolDbContext    → PostgreSQL DB 2 (anonymised, no user linkage, outside PDPA)
```

**Personal Bills DB tables:** `users`, `bills`, `bill_items`, `retailers`, `refresh_tokens`

**Comparison Pool DB tables:** `categories`, `products`, `retail_chains`, `prices`, `outlets`

## API Endpoints (MVP)

```
POST   /auth/register           → email, password, mobile → JWT + refresh
POST   /auth/login              → email, password → JWT + refresh
POST   /auth/google             → Google ID token → JWT + refresh
POST   /auth/refresh            → refresh token → new JWT + refresh

GET    /bills/upload-url        → S3 pre-signed upload URL
POST   /bills/scan              → triggers OCR with S3 object key, returns line items
POST   /bills/confirm           → saves confirmed bill, deletes S3 object, writes to both DBs
GET    /bills                   → paginated bill list (cursor-based)
GET    /bills/{id}              → bill detail with items + comparison results
DELETE /bills/{id}              → soft-delete, remove contributions from comparison pool

GET    /compare/item?name={id}  → price comparison across chains + color tier
GET    /compare/basket          → basket-level comparison
```

## Auth Flow

```
POST /auth/register:
  1. Validate email not taken, password strength (min 8 chars)
  2. Create user in Personal Bills DB via ASP.NET Core Identity
  3. Store consent flags (community_contribution: bool)
  4. Return success (no token — redirect to login)

POST /auth/google:
  1. Validate Google ID token
  2. Find or create user by Google sub/email
  3. First-time Google user: return requires_mobile: true
  4. Issue JWT + refresh token

Refresh token rotation:
  1. Look up token hash in DB, check not revoked, not expired
  2. Revoke old token, issue new refresh token + new JWT
```

## JWT Configuration (Program.cs)

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,        // 15-min exact expiry
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });
```

## OCR Orchestration Pattern

```
POST /bills/scan:
  1. Accept { objectKey }
  2. Construct S3 URL from objectKey
  3. Call Python OCR service via HttpClient (internal VPC in prod, localhost in dev)
  4. Receive structured JSON (retailer, date, items with confidence)
  5. For MEDIUM confidence items: include top-3 candidate_matches
  6. For LOW confidence: return raw text, no match
  7. Return result to mobile for review
```

## Confirm Bill → Comparison Pool Flow

```
POST /bills/confirm:
  1. Create bill + bill_items in Personal Bills DB
  2. For each confirmed item:
     a. Check user.community_contribution flag
     b. If true: UPSERT into Comparison Pool DB prices table
        - Anonymised: only canonical_name, chain, unit, unit_price, observed_month (YYYY-MM)
        - NO user_id, bill_id, or full date
        - Increment receipt_count if same (product, chain, month, price)
  3. Delete S3 object immediately via AWS SDK
  4. Return bill ID + summary
```

## Price Comparison Logic

```
PriceLookupService:
  1. Input: product_id, unit, unit_price, chain_id
  2. Query prices table: last 30 days across all chains
  3. Fallback 60 days with "older data" flag
  4. Find min unit_price → calculate % difference
  5. Assign color tier:
     ≤5%   → GREEN  (Good Deal)
     5-15% → GREY   (Typical)
     15-30%→ AMBER  (Moderate High)
     >30%  → RED    (Very High)
  6. Return: { tier, color, min_price, min_chain, savings, receipt_count, last_observed }
```

## Framing Rules

- NEVER return "expensive", "overpriced", "ripoff", "bad value", "avoid" in any API response
- ALWAYS use: "available for less at [Retailer]"
- Include trust indicator: "Based on N receipts. Last reported X days ago."

## File Locations

| Concern | Project | Path |
|---|---|---|
| Controllers | `ExpTracker.Api` | `src/ExpTracker.Api/Controllers/` |
| Middleware | `ExpTracker.Api` | `src/ExpTracker.Api/Middleware/` |
| Program.cs | `ExpTracker.Api` | `src/ExpTracker.Api/Program.cs` |
| Services | `ExpTracker.Core` | `src/ExpTracker.Core/Services/` |
| Interfaces | `ExpTracker.Core` | `src/ExpTracker.Core/Interfaces/` |
| DTOs/Models | `ExpTracker.Core` | `src/ExpTracker.Core/Models/Dtos/` |
| DbContexts | `ExpTracker.Infrastructure` | `src/ExpTracker.Infrastructure/Data/` |
| Migrations | `ExpTracker.Infrastructure` | `src/ExpTracker.Infrastructure/Data/Migrations/` |
| EF Configs | `ExpTracker.Infrastructure` | `src/ExpTracker.Infrastructure/Configurations/` |
| S3/JWT/Google Auth | `ExpTracker.Infrastructure` | `src/ExpTracker.Infrastructure/Services/` |
| Tests | (test project) | `tests/ExpTracker.*.Tests/` |

## Conventions

- Use `[Authorize]` on all non-auth endpoints
- ClaimsPrincipal populated with user ID from JWT
- Cursor-based pagination (after_id), page_size default 20
- Soft-delete bills (is_deleted flag), undo contributions on delete
- Timezone-aware for SGT (Singapore, UTC+8)
- All config via `appsettings.json` + environment variables
- CORS configured for mobile app origin
- Swagger UI available at `/swagger` in Development
