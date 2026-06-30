---
name: postgresql-db
description: Use when creating or modifying database schemas, EF Core migrations, seed data, or queries involving the two PostgreSQL databases (Personal Bills DB + Comparison Pool DB). Use when working with Npgsql, EF Core Fluent API configurations, or the seed data loader in scripts/seed/. Use ONLY for expTracker database work.
---

# PostgreSQL Database — expTracker

## Two-Database Architecture

```
PostgreSQL 16
├── Personal Bills DB          (private, user-linked, PDPA-governed)
└── Comparison Pool DB         (anonymised, no user linkage, outside PDPA)
```

Both run on the same PostgreSQL instance. In development: single Docker container with two databases. In production: AWS RDS PostgreSQL 16 ap-southeast-1.

## Database 1: Personal Bills DB

```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,                          -- NULL for Google-only users
  mobile        TEXT,
  google_id     TEXT UNIQUE,
  community_contribution BOOLEAN DEFAULT true, -- consent flag
  tier          TEXT DEFAULT 'free',           -- 'free' | 'premium' | 'founder'
  scans_this_month INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ
)

bills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  retailer_id   UUID REFERENCES retailers(id),
  subtotal      DECIMAL(10,2),
  gst           DECIMAL(10,2),
  total         DECIMAL(10,2),
  scanned_at    TIMESTAMPTZ,
  confirmed_at  TIMESTAMPTZ DEFAULT now(),
  is_deleted    BOOLEAN DEFAULT false,         -- soft delete
  created_at    TIMESTAMPTZ DEFAULT now()
)

bill_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id       UUID NOT NULL REFERENCES bills(id),
  raw_text      TEXT,
  matched_product_id UUID REFERENCES products(id),
  confidence    DECIMAL(3,2),                  -- 0.00-1.00
  confidence_tier TEXT,                        -- HIGH / MEDIUM / LOW
  qty           INTEGER,
  unit          TEXT,                          -- "600g", "1L"
  unit_price    DECIMAL(10,2),
  total         DECIMAL(10,2),
  created_at    TIMESTAMPTZ DEFAULT now()
)

retailers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_name    TEXT NOT NULL,                 -- "NTUC FairPrice"
  outlet_name   TEXT,
  outlet_address TEXT,
  postal_code   TEXT
)

refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

## Database 2: Comparison Pool DB

```sql
categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,          -- "Dairy", "Bakery"
  keywords      TEXT[]                         -- prefix keywords for matching
)

products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,                -- standardised product name
  category_id   UUID REFERENCES categories(id),
  unit          TEXT,                          -- standard unit
  aliases       TEXT[],                        -- known variations
  created_at    TIMESTAMPTZ DEFAULT now()
)

retail_chains (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE           -- "NTUC FairPrice"
)

prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id),
  chain_id      UUID NOT NULL REFERENCES retail_chains(id),
  outlet_id     UUID REFERENCES outlets(id),
  price         DECIMAL(10,2) NOT NULL,
  unit          TEXT NOT NULL,
  observed_month TEXT NOT NULL,                -- YYYY-MM only, no day
  source        TEXT NOT NULL DEFAULT 'user_scan', -- 'user_scan' | 'manual_seed'
  receipt_count INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now()
)

outlets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id      UUID NOT NULL REFERENCES retail_chains(id),
  name          TEXT NOT NULL,                 -- "Clementi Mall"
  address       TEXT,
  postal_code   TEXT
)
```

## Critical: No PII in Comparison Pool

The `prices` table must **never** contain:
- `user_id` — no user linkage
- `bill_id` — no bill linkage
- Full date — only `observed_month` (YYYY-MM)
- Any personal identifier

This keeps the comparison pool outside PDPA personal data scope by design.

## EF Core Configuration

Located in the `ExpTracker.Infrastructure` project (see `dotnet-solution-structure` skill). Two separate `DbContext` classes in `src/ExpTracker.Infrastructure/Data/`:

```csharp
// PersonalBillsDbContext.cs
public class PersonalBillsDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Bill> Bills { get; set; }
    public DbSet<BillItem> BillItems { get; set; }
    public DbSet<Retailer> Retailers { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
}

// ComparisonPoolDbContext.cs
public class ComparisonPoolDbContext : DbContext
{
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<RetailChain> RetailChains { get; set; }
    public DbSet<Price> Prices { get; set; }
    public DbSet<Outlet> Outlets { get; set; }
}
```

## Migrations

```bash
# Create migration for Personal Bills DB
dotnet ef migrations add InitialCreate --context PersonalBillsDbContext \
  --output-dir Data/Migrations/PersonalBills

# Create migration for Comparison Pool DB
dotnet ef migrations add InitialCreate --context ComparisonPoolDbContext \
  --output-dir Data/Migrations/ComparisonPool

# Apply in development
dotnet ef database update --context PersonalBillsDbContext
dotnet ef database update --context ComparisonPoolDbContext
```

Apply migrations on startup in Development only. In production, run as part of CI/CD or manual migration step.

## Seed Data

Location: `scripts/seed/`

```
scripts/seed/
├── seed-data.json    # 50 staple product definitions
├── seed-prices.json  # Prices across 6 chains for 50 staples
└── load-seed.py      # Idempotent DB seed loader
```

Seed data covers:
- 50 staple items across 10 categories
- 6 retailer chains: NTUC FairPrice, Sheng Siong, Cold Storage, Giant, Don Don Donki, Indian provision shops (3 outlets)
- Prices with `source='manual_seed'`

Seed loader must be **idempotent** — run multiple times without duplicates, using UPSERT by `canonical_name` + `chain`.

## UPSERT Logic (prices table)

When a new confirmed price arrives:

| Condition | Action |
|---|---|
| Same (product, chain, month, price) | Increment `receipt_count`, update `last_observed` |
| Same (product, chain, month) but different price | Insert new row (promotions, different outlets) |
| New product or chain | Insert new row |

## Query Patterns

```sql
-- Comparison: cheapest price in last 30 days
SELECT chain_id, MIN(unit_price) as min_price, COUNT(*) as receipt_count
FROM prices
WHERE product_id = @productId
  AND observed_month >= to_char(NOW() - INTERVAL '30 days', 'YYYY-MM')
GROUP BY chain_id
ORDER BY min_price ASC;

-- Fallback: extend to 60 days
-- Same query, replace '30 days' with '60 days', add flag "older data"

-- Cursor-based pagination for bills
SELECT * FROM bills
WHERE user_id = @userId
  AND id > @afterId
  AND is_deleted = false
ORDER BY id ASC
LIMIT @pageSize;  -- default 20
```

## Conventions

- All primary keys: UUID v4 (`gen_random_uuid()`)
- All timestamps: `TIMESTAMPTZ` (timezone-aware)
- Soft-delete for bills (never hard-delete user data)
- Audit trail: `created_at` on every table, `updated_at` where mutations occur
- Indexes: FK columns, `user_id`, `observed_month`, `product_id + chain_id`
- No foreign keys from Personal Bills DB to Comparison Pool DB — they are logically separate
- Connection strings configured per environment in `appsettings.json` + env vars
