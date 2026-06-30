# ExpTracker — System Architecture

> Living document. All architectural decisions resolved as of 30 Jun 2026.
> Decision log in `threads/` directory. See `epics.md` for implementation breakdown.

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    React Native App (bare)                        │
│  Zustand state │ WatermelonDB cache │ React Navigation v6         │
│  Camera → On-device blur check → Upload → Review → Confirm        │
└───────────────────────┬──────────────────────────────────────────┘
                        │ HTTPS / REST (JWT)
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                   .NET 10 Backend API                             │
│  ASP.NET Identity │ JWT + Google │ Bills API │ Comparison API     │
│  Image Upload Handler │ S3 Pre-signed URLs                       │
└──────┬──────────────────────────────────────┬────────────────────┘
       │ HTTP (internal VPC)                  │
       ▼                                      ▼
┌──────────────────┐             ┌─────────────────────────────────┐
│  Python OCR      │             │  Temp Image Storage              │
│  Microservice    │             │  Dev: S3Ninja (local)            │
│  FastAPI         │             │  Prod: AWS S3 ap-southeast-1    │
│  OpenCV →        │             │  2-hr TTL lifecycle policy       │
│  PaddleOCR →     │             │  Success: immediate delete       │
│  Category filter │             └─────────────────────────────────┘
│  → RapidFuzz     │
└──────────────────┘
       │ returns structured JSON (items, prices, retailer)
       │
┌──────┴────────────────────────────────────────────────────────────┐
│                   Two-Database Architecture (PostgreSQL 16)        │
│                                                                    │
│  [Personal Bills DB]          [Comparison Pool DB]                 │
│  Linked to user account       Anonymised — no user linkage         │
│  Private, PDPA-governed       Outside PDPA scope (fully anonymised)│
│  Stores: user, bills,         Stores: item name, price, unit,      │
│  items, amounts, date,        retailer chain, store outlet,        │
│  retailer, outlet             month/year only                      │
│                                                                    │
│  On-device cache:             Sources: user_scan (confirmed) |     │
│  WatermelonDB                 manual_seed                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mobile App (React Native — Bare)

### 2.1 Decisions

| Concern | Decision | Source |
|---|---|---|
| Framework | Bare React Native (no Expo) | T18 |
| Navigation | React Navigation v6, Bottom Tab + 4 Stack Navigators | A1 |
| State management | Zustand | A2 |
| Local bill storage | WatermelonDB (MIT, reactive, lazy loading) | A3 |
| Camera library | react-native-vision-camera v3+ | T18 |
| Permissions | react-native-permissions (from day 1) | T19 |
| File I/O | react-native-fs (app cache directory) | T18 |
| On-device blur check | Laplacian variance before upload | T17 |
| Local image lifecycle | Delete from device cache once upload completes | T21 |

### 2.2 Navigation Structure

```
BottomTabNavigator
  ├── HomeStack       (Home → ScanReceipt → ConfirmOCR)
  ├── ExpensesStack   (ExpenseList → BillDetail)
  ├── CompareStack    (CompareHome → ItemDetail)
  └── SettingsStack   (Settings → Profile)

Packages: @react-navigation/native, @react-navigation/bottom-tabs,
          @react-navigation/native-stack, react-native-screens,
          react-native-safe-area-context
```

### 2.3 Zustand Store Slices

| Slice | Purpose |
|---|---|
| `auth` | User session, JWT, refresh token, login state |
| `scan` | Camera state, captured image URI, upload progress, OCR result, confirmation state |
| `expenses` | Cached bill list, pagination cursor |
| `compare` | Comparison results for current items, loading state |

### 2.4 WatermelonDB Sync Strategy

- Pull on app launch: full sync from Personal Bills DB
- Incremental sync: records updated since last sync timestamp
- Conflict resolution: most recent `confirmed_at` wins
- Offline writes: queued locally, pushed on connectivity restore

### 2.5 Screen Flow

```
Launch
  └─ Auth (Register / Login / Google Sign-in)
       └─ Home (expense summary + quick-scan FAB)
            ├─ Scan Receipt
            │    ├─ Camera capture
            │    ├─ On-device blur check → retake if blurry
            │    ├─ Upload to temp S3
            │    ├─ OCR result review / confirm
            │    └─ Save → delete temp image → back to Home
            ├─ Expense List
            │    └─ Bill Detail (item list with comparison colors)
            ├─ Compare Prices
            │    ├─ Chain-level price comparison (MVP)
            │    ├─ Color indicators: green ≤5% / grey 5-15% / amber 15-30% / red >30%
            │    └─ Item Detail → "Available for less at X" + N receipt sources
            └─ Settings / Profile
                 ├─ Privacy consent toggles
                 ├─ Account management
                 └─ App version
```

### 2.6 Camera & Permission Flow

```
App launch
  → Check camera permission (react-native-permissions)
    ├─ Granted → proceed to camera
    ├─ Denied → show rationale, link to Settings
    └─ Undetermined → request, handle denial
  → Capture photo (react-native-vision-camera, high-res, auto-focus)
  → On-device blur detection (Laplacian variance)
    ├─ Sharp → proceed to upload
    └─ Blurry → prompt retake
  → Save to app cache dir (react-native-fs) — NO storage permission needed
  → Upload to pre-signed S3 URL
  → Delete from local cache
```

---

## 3. .NET 10 Backend API

### 3.1 Decisions

| Concern | Decision | Source |
|---|---|---|
| Language / runtime | C# / .NET 10 LTS (supported to Nov 2028) | A4 |
| Database | PostgreSQL 16 (self-hosted Docker for dev, AWS RDS for prod) | A4 |
| ORM | EF Core 10 + Npgsql | A4 |
| Auth | ASP.NET Core Identity + JWT + Google external provider | A5 |
| Token strategy | Short-lived access token (15 min) + refresh token rotation | A5 |
| Cloud provider | AWS (ap-southeast-1, Singapore region) | A7 |
| OCR call pattern | Upload image to temp S3 → call Python service via HttpClient → receive JSON → serve to mobile for confirmation → on confirm: write to DBs + delete S3 object | T20 |
| Communication to Python | HttpClient → FastAPI endpoint (internal VPC) | T20 |

### 3.2 Planned API Surface (MVP)

```
POST   /auth/register           → email, password, mobile → JWT + refresh
POST   /auth/login              → email, password → JWT + refresh
POST   /auth/google             → Google ID token → JWT + refresh
POST   /auth/refresh            → refresh token → new JWT + refresh

GET    /bills/upload-url        → returns S3 pre-signed upload URL
POST   /bills/scan              → triggers OCR with S3 object key, returns line items
POST   /bills/confirm           → saves confirmed bill, deletes S3 object, writes to both DBs
GET    /bills                   → paginated bill list (cursor-based)
GET    /bills/{id}              → bill detail with items + comparison results
DELETE /bills/{id}              → soft-delete bill, remove contributions from comparison pool

GET    /compare/item?name={id}  → price comparison across chains + color tier
GET    /compare/basket          → submit list of item IDs, get basket-level comparison
```

### 3.3 Auth Flow — Google Sign-in

```
Mobile App                                    Backend
  │                                              │
  ├─ Google Sign-In SDK → ID token ──────────────►
  │                                              ├─ Verify token with Google API
  │                                              ├─ Find or create local user (ASP.NET Identity)
  │                                              ├─ Generate JWT + refresh token
  │                           ◄── JWT + refresh ─┤
  │                                              │
  │  (All subsequent requests include JWT in     │
  │   Authorization header. Refresh via           │
  │   /auth/refresh using rotating refresh token) │
```

- Google client IDs: separate for Android and iOS
- Backend validates `sub` claim and `aud` matches configured client ID
- First-time Google login: auto-creates local account, prompts for mobile number on first app launch

---

## 4. Python OCR Microservice

### 4.1 Decisions

| Concern | Decision | Source |
|---|---|---|
| Web framework | FastAPI (async, scalable) | T20 |
| Preprocessing | OpenCV (deskew, CLAHE contrast, bilateral denoise, Otsu binarisation) | T20 |
| OCR engine | PaddleOCR (English + Chinese model, Apache 2.0) | T15 |
| Fuzzy matching | RapidFuzz, three-tier confidence | T03 |
| Category pre-filter | Keyword prefix filter for MVP | A6 |
| Stateless | Yes — no session state, independently scalable | T20 |

### 4.2 Confidence Tiers

| Tier | Score | Action |
|---|---|---|
| HIGH | > 85% | Auto-match to canonical product, no user prompt needed |
| MEDIUM | 60–85% | Show user "Is this [X]? Yes / No" — crowdsourced confirmation |
| LOW | < 60% | Treat as new/unmatched item, user manually categorises |

### 4.3 Category Pre-Filter (Keyword Prefix Map)

Before running RapidFuzz against the comparison pool, narrow the candidate set by category using a keyword prefix map:

```
Dairy        → MILK, YOGURT, CHEESE, BUTTER, CREAM, YGT, CHZ, MLK
Produce      → FRESH, ORGANIC, LETTUCE, TOMATO, BANANA, APPLE, VEG
Beverages    → DRINK, JUICE, COFFEE, TEA, WATER, SODA, COLA, SPRITE
Snacks       → CHIPS, CRACKER, BISCUIT, NUT, CHOCOLATE, CANDY
Staples      → RICE, FLOUR, SUGAR, OIL, SALT, SAUCE, SPICE, NOODLE
Meat/Seafood → CHICKEN, BEEF, PORK, FISH, PRAWN, SALMON, MEAT
Bakery       → BREAD, BUN, CAKE, PASTRY, TOAST, LOAF
Household    → TISSUE, SOAP, DETERGENT, CLEAN, SHAMPOO, TOOTHPASTE
Frozen       → FROZEN, ICE CREAM, FROZ VEG, FROZ MEAT
Baby         → DIAPER, FORMULA, BABY WIPE, BABY FOOD
```

### 4.4 Processing Pipeline

```
1. Receive image (binary or S3 URL)
2. OpenCV preprocessing
   a. Deskew (Hough line transform)
   b. Contrast enhancement (CLAHE)
   c. Noise reduction (bilateral filter)
   d. Binarisation (Otsu's threshold)
3. PaddleOCR — extract raw text blocks
4. Post-processing
   a. Parse line items: name | qty | unit | unit price | total
   b. Identify retailer name + outlet address (receipt header)
   c. Identify date
   d. Category detection via keyword prefix filter
   e. RapidFuzz matching against known items within detected category
5. Return structured JSON:
   {
     "retailer": {
       "chain": "NTUC FairPrice",
       "outlet": "Clementi Mall, 3155 Commonwealth Ave W"
     },
     "date": "2024-10-15",
     "items": [
       {
         "raw": "SUNSHINE WHT BRD 600G",
         "matched_name": "Sunshine White Bread 600g",
         "confidence": 0.91,
         "confidence_tier": "HIGH",
         "category": "Bakery",
         "qty": 1,
         "unit": "600g",
         "unit_price": 3.25,
         "total": 3.25
       }
     ],
     "subtotal": 45.80,
     "gst": 3.21,
     "total": 49.01
   }
```

---

## 5. Data Architecture

### 5.1 Personal Bills Database (private, PDPA-governed, PostgreSQL)

```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,                          -- NULL for Google-only users
  mobile        TEXT,
  google_id     TEXT UNIQUE,                   -- Google account sub claim
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
  raw_text      TEXT,                          -- original OCR output
  matched_product_id UUID REFERENCES products(id), -- FK to comparison pool
  confidence    DECIMAL(3,2),                  -- OCR confidence 0.00-1.00
  confidence_tier TEXT,                        -- HIGH / MEDIUM / LOW
  qty           INTEGER,
  unit          TEXT,                          -- e.g. "600g", "1L"
  unit_price    DECIMAL(10,2),
  total         DECIMAL(10,2),
  created_at    TIMESTAMPTZ DEFAULT now()
)

retailers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_name    TEXT NOT NULL,                 -- e.g. "NTUC FairPrice"
  outlet_name   TEXT,                          -- e.g. "Clementi Mall"
  outlet_address TEXT,                         -- full address from receipt
  postal_code   TEXT                           -- extracted if available
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

### 5.2 Comparison Pool Database (anonymised, no user linkage, PostgreSQL)

```sql
categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,          -- e.g. "Dairy", "Bakery"
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
  name          TEXT NOT NULL UNIQUE           -- e.g. "NTUC FairPrice"
)

prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id),
  chain_id      UUID NOT NULL REFERENCES retail_chains(id),
  outlet_id     UUID REFERENCES outlets(id),   -- outlet-level when available
  price         DECIMAL(10,2) NOT NULL,
  unit          TEXT NOT NULL,
  observed_month TEXT NOT NULL,                -- YYYY-MM only, no day
  source        TEXT NOT NULL DEFAULT 'user_scan', -- 'user_scan' | 'manual_seed'
  receipt_count INTEGER DEFAULT 1,             -- number of receipts confirming this price
  created_at    TIMESTAMPTZ DEFAULT now()
)

outlets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id      UUID NOT NULL REFERENCES retail_chains(id),
  name          TEXT NOT NULL,                 -- e.g. "Clementi Mall"
  address       TEXT,                          -- full address
  postal_code   TEXT
)
```

### 5.3 Data Flow: confirmed scan → comparison pool

```
bill_items.confirmed AND user has community consent ON
  → extract: product.canonical_name, retailer.chain, retailer.outlet,
             unit, unit_price, observed_month
  → UPSERT into prices table (update receipt_count + price if existing)
  → NO reference to user_id, bill_id, or full date
  → Images deleted; only structured text persists
```

### 5.4 WatermelonDB Local Schema (mirror of Personal Bills DB)

```
users          (id, email, mobile, created_at)
bills          (id, user_id, retailer_name, outlet_name, total, confirmed_at, _sync_status)
bill_items     (id, bill_id, raw_text, matched_name, qty, unit, unit_price, total, confidence)
_sync_status:  'synced' | 'created' | 'updated' | 'deleted'
```

---

## 6. Comparison Engine — Color Tiers & Benchmarks

| Tier | Color | Threshold vs Lowest Observed Price (30-day window) | Meaning |
|---|---|---|---|
| Good Deal | Green | ≤ 5% above lowest | Among the cheapest available |
| Typical | Grey | 5%–15% above lowest | Standard, but could be cheaper |
| Moderate High | Amber | 15%–30% above lowest | Noticeably more; savings possible |
| Very High | Red | > 30% above lowest | Significant premium |
| No Data | Neutral | — | Insufficient comparison data |

- **Primary benchmark**: lowest unit price ($/kg, $/litre) observed in last 30 days across all chains
- **Fallback**: extend to 60 days if no 30-day data, clearly indicate "based on older data"
- **Display**: always show "based on N receipts" and "last reported X days ago" for trust
- **Framing rule**: NEVER use "expensive/overpriced/rip-off" — always "available for less at X"

---

## 7. Cloud Infrastructure

### 7.1 Decisions

| Concern | Decision | Source |
|---|---|---|
| Cloud provider (prod) | AWS ap-southeast-1 (Singapore) | A7 |
| Cloud dependency (dev) | Zero — everything runs locally | — |
| Managed DB (prod) | AWS RDS PostgreSQL 16 | A4 |
| DB (dev) | Self-hosted PostgreSQL via Docker Compose | A4 |
| Temp image storage (prod) | AWS S3 with 2-hr object lifecycle policy | T21 |
| Temp image storage (dev) | S3Ninja (local S3 emulator, no AWS account needed) | — |
| Image on success | Immediately deleted by .NET backend | T21 |
| Image on crash | TTL / expiry policy auto-cleans after 2 hours | T21 |
| Container runtime (prod) | ECS Fargate (serverless, scales with demand) | A7 |
| Auth | ASP.NET Core Identity (no Cognito dependency) | A5 |

### 7.2 Dev Environment (Zero AWS Dependency)

```
docker-compose.yml:
  - PostgreSQL 16 (port 5432)
  - Python OCR service (FastAPI, port 8000)
  - .NET 10 API (port 5000)
  - S3Ninja (S3 emulation, port 9444)
```
All services run locally. S3Ninja emulates the S3 API — the .NET backend uses the standard AWS SDK pointed at http://localhost:9444. No AWS account, credentials, or network access required for development. When deploying to production, only the S3 endpoint URL and credentials change.

---

## 8. Privacy & Regulatory Compliance

### 8.1 Data Classification

| Data | Location | PDPA Scope | Retention |
|---|---|---|---|
| User account (email, mobile, Google ID) | Personal Bills DB | Personal data | Until account deletion |
| Bills & items (user-linked) | Personal Bills DB + WatermelonDB cache | Personal data | Until account deletion or user deletes |
| Receipt images | S3 (temp, 2-hr TTL) | Personal data | Max 2 hours; deleted immediately on confirm |
| Comparison pool entries | Comparison Pool DB | **Outside PDPA** (fully anonymised) | Indefinite (crowd utility) |

### 8.2 Consent Flow

At account creation, two separate checkboxes:

1. **Required**: "I agree to my expense data being stored for personal tracking"
2. **Optional (default ON)**: "I agree to contribute anonymised item prices to help the community compare retailers"

Both clearly explained. Default ON for community sharing (legally acceptable under PDPA with clear explanation).
Non-contributors still see basic comparisons. Contributors get richer insights (price alerts, more granular data).

### 8.3 PDPA Compliance Checklist

| Obligation | Implementation |
|---|---|
| Consent | Two checkboxes at signup, clearly explained |
| Purpose limitation | Data used only for stated purposes |
| Access & correction | Users can view, edit, delete their bills; request full data export |
| Data accuracy | Confirmation gate before data enters comparison pool |
| Retention limitation | Images deleted immediately or via 2-hr TTL; bills deleted on user request |
| Breach notification | Report to PDPC within 3 business days if significant harm |
| Data residency | All data in AWS ap-southeast-1 (Singapore) |

### 8.4 Communication Framing Policy

```
FORBIDDEN WORDS: expensive, overpriced, ripoff, avoid, bad value, worst
ALLOWED PHRASING: "available for less at [Retailer]" | "lower price found at [Retailer]"
                  "price difference: $X" | "based on N receipts in the last 30 days"
```

---

## 9. MVP Scope Boundary

**In MVP:**
- Singapore only, Android + iOS
- Grocery receipts only (6 chains: NTUC FairPrice, Sheng Siong, Cold Storage, Giant, Don Don Donki, Indian provision shops)
- OCR: English + Chinese receipt support
- Chain-level price comparison display (outlet-level data collected for future use)
- Color-tier comparison indicators (green/grey/amber/red) with "available for less at X" framing
- Freemium gating from day 1 (10 scans/month free)
- Manual seed data: top 50 staples priced across all 6 retailer categories
- Google Sign-in + email/password auth
- Confirmation gate mandatory for comparison pool contribution
- On-device blur detection before upload

**Out of MVP (future phases):**
- Outlet-level comparison display
- Budget tracking / spending alerts
- Category auto-tagging by AI
- Data export (CSV/PDF)
- Multi-currency
- Web dashboard for rich analytics
- Retailer partnerships / sponsored placements
- Advertising-based monetisation
- Non-grocery categories (restaurants, fuel, pharmacies, retail)
