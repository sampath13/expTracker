# ExpTracker — Epics & Work Breakdown

> All architectural decisions resolved. See `docs/architecture.md` for system design.
> Decision threads referenced throughout; see `docs/decisions/` for full discussion.
> Monorepo layout: see `.monorepo-structure.md`.

---

## Pre-Dev: Monorepo Reorganisation

**Goal:** Reorganise the flat repo into the monorepo layout before any implementation begins.

**Priority:** CRITICAL — must complete before Epic 0

**Dependencies:** None

**Linked:** `.monorepo-structure.md`, `stories/pre-dev-reorg/P0.1-monorepo-reorg.md`

### Scope

| In | Out |
|---|---|
| Create `apps/`, `docs/`, `docker/`, `scripts/`, `.github/` dirs | Scaffolding app code |
| Move existing docs to `docs/` | Creating new files |
| Move `threader/` to `apps/threader/` | Changing threader functionality |
| Fix threader path after move | Docker Compose (Epic 0 / S0.9) |
| `stories/` stays at root and `threads/` → `docs/decisions/` | — |

### Story Breakdown

#### P0.1 — Monorepo folder reorganisation
- Create target directories: `apps/`, `docs/`, `docker/`, `scripts/`, `.github/workflows/`
- Move `architecture.md`, `epics.md`, `product-overview.md`, `open-questions.md` → `docs/`
- Move `threader/` → `apps/threader/`, fix `server.js:11` threads path
- Keep `stories/` at root and move `threads/` → `docs/decisions/`
- Verify threader still works, no broken paths

---

## Epic 0: Project Scaffold & Cross-Cutting Concerns

**Goal:** Establish the three-tier development environment (mobile, backend, OCR service) with all cross-cutting infrastructure in place before feature work begins.

**Priority:** HIGH — blocks all other epics

**Dependencies:** None

**Linked Threads:** T18, T19, T20, A1, A2, A3, A4, A7

### Scope

| In | Out |
|---|---|
| RN bare project with navigation shell | Feature screens (placeholder only) |
| Zustand store skeleton (4 slices) | Actual business logic |
| WatermelonDB schema + sync adapter | Real data sync |
| Mobile API client (JWT interceptor + refresh retry) | — |
| .NET 10 project with PostgreSQL + EF Core | Controllers/endpoints |
| Python FastAPI project + PaddleOCR setup | OCR processing logic |
| Docker Compose for dev (PG, OCR, .NET, LocalStack) | Production IaC |
| ESLint/Prettier/FxCop config | — |
| Environment configs (.env for all three tiers) | — |

### Story Breakdown

#### S0.1 — React Native project scaffold
- Init bare React Native (npx react-native init)
- Install navigation packages, configure React Navigation v6
- Set up Bottom Tab Navigator with 4 placeholder stacks (Home, Expenses, Compare, Settings)
- Placeholder screens for each tab
- Verify Android build runs on emulator

#### S0.2 — Zustand store skeleton
- Install Zustand
- Create store directory with 4 slice files: auth, scan, expenses, compare
- Each slice: initial state + actions, no implementation yet
- Wrap app root with no provider needed (Zustand is provider-free)

#### S0.3 — WatermelonDB setup
- Install WatermelonDB + SQLite adapter
- Define schema: users, bills, bill_items (mirror of cloud schema, section 5.4 of architecture.md)
- Create database provider and model classes
- Verify local DB creates tables on first launch
- Stub sync adapter (no-ops until backend is ready)

#### S0.4 — react-native-permissions foundation
- Install react-native-permissions
- Configure AndroidManifest.xml: CAMERA permission
- No storage permission (images stored in app cache only)
- Create usePermissions hook: check → request → handle denial flow
- Test permission prompt flow on Android emulator

#### S0.5 — React Native camera + file I/O setup
- Install react-native-vision-camera v3+
- Install react-native-fs
- Configure camera component (preview, capture photo, save to app cache dir)
- On-device blur detection: compute Laplacian variance on captured image
- Quality gate: if variance < threshold, prompt retake; else proceed
- Delete local image after upload completes

#### S0.6 — .NET 10 backend scaffold
- dotnet new webapi targeting net10.0
- Add NuGet packages: EF Core 10, Npgsql, ASP.NET Core Identity, JWT Bearer
- Configure PostgreSQL connection string (Docker Compose + AWS RDS via env)
- Program.cs: CORS, auth middleware, Swagger, EF Core registration
- Empty controllers directory with placeholder

#### S0.7 — Backend DB migrations (Personal Bills + Comparison Pool)
- Create EF Core models for both DBs (section 5.1 and 5.2 of architecture.md)
- Two separate DbContext classes (PersonalBillsDbContext, ComparisonPoolDbContext)
- Generate initial migrations for both contexts
- Apply migrations on startup in Development

#### S0.8 — Python OCR service scaffold
- Create FastAPI project structure
- Install dependencies: fastapi, uvicorn, opencv-python, paddleocr, paddlepaddle, rapidfuzz
- Single health-check endpoint (GET /health)
- Download PaddleOCR English + Chinese models on startup
- Verify OCR runs end-to-end with a sample receipt image

#### S0.9 — Docker Compose dev environment
- docker-compose.yml: PostgreSQL 16, API (.NET), OCR (Python), S3Ninja
- .NET API waits for PostgreSQL to be healthy
- OCR service health check
- S3Ninja: S3-compatible API at localhost:9444, bucket auto-created on startup
- No AWS account or credentials required — .NET SDK pointed at S3Ninja endpoint
- .env.example for all required config values

#### S0.10 — CI skeleton
- GitHub Actions workflow: lint → test → build for all three tiers
- Android APK build job
- .NET build + test job with real assertions (health endpoint returns 200, DI resolves DbContext)
- Python lint + test job with real assertions (GET /health returns 200 with model_status field)
- No deployment yet (manual for MVP)

#### S0.11 — Mobile API client module (cross-cutting)
- Create `api.js`: axios/fetch wrapper with base URL from env, 15s timeout
- JWT request interceptor: attach Bearer token to all authenticated requests
- 401 response interceptor: attempt silent refresh via POST /auth/refresh; on success, update tokens and retry original request; on failure, clear auth state
- Concurrent request queue during refresh to prevent multiple simultaneous refresh calls
- `authService.js`: typed wrappers for login, register, googleLogin, refreshToken
- Shared request/response types in `src/api/types.js`

### Acceptance Criteria
1. `docker compose up` starts PG, .NET API, OCR service, S3Ninja — all healthy
2. RN app launches on Android emulator with tab bar and 4 placeholder screens
3. Camera permission flow works (grant/deny/blocked states)
4. Zustand store initialises with 4 slices matching defined state shapes
5. WatermelonDB creates tables on first app launch
6. Swagger UI loads at localhost:5000/swagger with no errors
7. `GET /health` on Python OCR service returns 200
8. PaddleOCR processes a sample receipt image and returns text
9. S3Ninja health check passes, bucket is writable via AWS SDK
10. API client module attaches JWT to requests and handles 401 with silent refresh
11. CI pipeline passes with real test assertions (not dummy tests)

---

## Epic 1: Authentication & User Management

**Goal:** User registration, login (email/password + Google Sign-in), JWT issuance, refresh token rotation, and consent flow.

**Priority:** HIGH — required before any user-specific data can be stored

**Dependencies:** Epic 0

**Linked Threads:** T08, T09, T10, T11, A5

### Scope

| In | Out |
|---|---|
| Email/password registration + login | Social logins beyond Google |
| Google Sign-in (Android + iOS) | Apple Sign-in (future) |
| JWT access + refresh token rotation | MFA |
| Two consent checkboxes at signup | Advanced consent management |
| Token-based auth middleware | Role-based access control |
| Mobile: login/register screens + Google button | — |
| Zustand auth slice | — |

### Story Breakdown

#### S1.1 — ASP.NET Core Identity setup (backend)
- Configure Identity with custom User entity (email, mobile, Google ID)
- Add Identity to DI pipeline
- Create Identity migrations, apply to DB
- Password hashing via Identity defaults (PBKDF2)

#### S1.2 — Email/Password registration endpoint (backend)
- POST /auth/register: accept email, password, mobile, consent flags
- Validate email not taken, password strength (min 8 chars)
- Create user in Personal Bills DB
- Store consent flags (community_contribution: bool)
- Return success (no token — redirects to login)

#### S1.3 — Email/Password login endpoint (backend)
- POST /auth/login: accept email, password
- Validate credentials via Identity SignInManager
- Issue JWT (15-min expiry) + refresh token (30-day expiry, rotating)
- Store refresh token hash in DB
- Return JWT + refresh token to mobile

#### S1.4 — Google Sign-in integration (backend)
- POST /auth/google: accept Google ID token
- Validate token with Google's tokeninfo endpoint / JWT validation
- Extract sub, email, name from verified token
- Find existing user by Google ID or email; create if new
- Issue JWT + refresh token
- First-time Google user: return flag `requires_mobile: true` to prompt mobile number entry

#### S1.5 — JWT refresh token endpoint (backend)
- POST /auth/refresh: accept refresh token
- Look up token hash in DB, check not revoked, not expired
- Rotate: revoke old token, issue new refresh token, issue new JWT
- Return new JWT + new refresh token

#### S1.6 — Auth middleware + authorize attribute (backend)
- Configure JWT Bearer authentication in Program.cs
- Configure token validation parameters (issuer, audience, signing key)
- Add [Authorize] attribute to all non-auth endpoints
- ClaimsPrincipal populated with user ID from JWT

#### S1.7 — Consent storage & retrieval (backend)
- Store consent flags on user entity (PDPA_consent, community_contribution, marketing_opt_in)
- GET /user/consent: return current consent state
- PATCH /user/consent: update consent flags
- Consent log (immutable audit trail of consent changes)

#### S1.8 — Mobile: Login screen
- Two inputs: email, password + Login button
- "Sign in with Google" button (Google Sign-In SDK)
- Link to Register screen
- On success: store JWT + refresh token in Zustand auth slice
- On Google success: if `requires_mobile`, navigate to mobile number screen
- Wire to authService from S0.11 (not direct HTTP calls)

#### S1.9 — Mobile: Register screen
- Three inputs: email, password, mobile
- Two consent checkboxes:
  1. Required: "I agree to my expense data being stored for personal tracking"
  2. Optional (default ON): "I agree to contribute anonymised item prices to help the community"
- Each checkbox: short explanation text; link to privacy policy
- "Create account" button → POST /auth/register → success → navigate to Login

#### S1.10 — Mobile: Auth state, token management & navigation guard
- Store: JWT, refresh token, user profile, isAuthenticated
- Axios/Fetch interceptor: attach JWT to every request (via S0.11 api.js)
- Token refresh interceptor: on 401, attempt refresh; if refresh fails, log out (via S0.11)
- Persist tokens to secure storage (react-native-keychain or expo-secure-store)
- On app launch: load stored tokens, validate expiry, auto-refresh if needed
- Root navigator conditional: if authenticated → AppNavigator (tabs), else → AuthStack (login/register)
- AuthStack screens: Login, Register, MobileEntry
- SplashScreen shown during initial token check; no flash on auth transition
- Logout clears tokens and returns to AuthStack

### Acceptance Criteria
1. User can register with email/password/mobile + consent flags
2. User can log in with email/password, receive JWT
3. User can log in with Google, first-time and returning
4. JWT expires after 15 min, auto-refresh works silently
5. Refresh token rotation works (old token revoked on use)
6. Invalid/expired tokens return 401, app redirects to login
7. Consent flags stored and retrievable
8. Navigation guard blocks unauthenticated access, swaps seamlessly on login/logout
9. Duplicate email registration returns proper error

---

## Epic 2: Receipt Capture & Image Upload

**Goal:** End-to-end camera capture → on-device quality check → upload to S3 temp storage → trigger OCR flow.

**Priority:** HIGH — core user flow, blocks Epics 3 and 4

**Dependencies:** Epic 0, Epic 1 (auth for upload)

**Linked Threads:** T15, T18, T19, T20, T21

### Scope

| In | Out |
|---|---|
| Camera capture with auto-focus | Manual gallery pick (future) |
| On-device blur detection | Advanced image filters |
| S3 pre-signed URL generation (backend) | Multi-image stitching |
| Image upload from mobile to S3 | Background upload |
| Temp image lifecycle (2-hr TTL + explicit delete) | Permanent image storage |
| Upload progress indicator | — |

### Story Breakdown

#### S2.1 — S3 pre-signed URL endpoint (backend)
- GET /bills/upload-url: generate S3 pre-signed PUT URL (5-min expiry)
- Dev: talks to S3Ninja at localhost:9444 (configured via env var)
- Prod: talks to AWS S3 ap-southeast-1 (endpoint URL swapped via env)
- Returns: uploadUrl, objectKey (UUID)
- ObjectKey stored in response for subsequent /bills/scan call
- Bucket-level expiry policy for unconfirmed uploads (2-hr TTL in prod; dev uses S3Ninja lifecycle config)

#### S2.2 — Mobile: Camera screen
- Full-screen camera preview (react-native-vision-camera)
- Capture button (floating, bottom-center)
- Flash toggle (auto/on/off)
- Last captured thumbnail in corner (tap to re-capture)
- Camera permission check on screen mount, handle denial gracefully
- Toast: "Hold steady for a clear scan"

#### S2.3 — Mobile: On-device blur detection
- After capture, compute Laplacian variance on image
- If variance < threshold (empirically determined, ~100): overlay "Image is blurry — retake?"
- Retake button: discard, return to camera
- Use anyway button: proceed despite blur
- Perform computation off main thread (react-native-reanimated or worklets)

#### S2.4 — Mobile: Image upload to S3
- After quality check passes, request pre-signed URL from GET /bills/upload-url
- Upload image binary (PUT to S3 pre-signed URL)
- Progress indicator (circular, percentage)
- On success: call POST /bills/scan with objectKey, navigate to OCR review
- On failure: retry option, error message
- Delete local image from cache after upload

#### S2.5 — Manual entry fallback
- If camera fails or user declines permission
- Simple form: retailer name (text/picker), date (date picker)
- List of items: add row (name, qty, unit, price), remove row
- Save → POST /bills/manual (skip OCR, write directly to Personal Bills DB)
- Same confirmation flow for comparison contribution

### Acceptance Criteria
1. User can capture receipt photo from camera
2. Blurry image triggers retake prompt
3. Image uploads to S3 with progress indicator
4. Pre-signed URL flow works end-to-end
5. Camera permission denial shows error state with manual entry option
6. Manual entry flow allows saving bills without OCR
7. Upload failure shows retry option
8. Local image deleted from device after upload

---

## Epic 3: OCR Pipeline

**Goal:** Python OCR microservice processes receipt images and returns structured line-item data.

**Priority:** HIGH — core processing engine, blocks Epics 4 and 5

**Dependencies:** Epic 0, Epic 2

**Linked Threads:** T03, T15, T16, T17, T20, A6

### Scope

| In | Out |
|---|---|
| OpenCV preprocessing pipeline | ML-based receipt parsing |
| PaddleOCR text extraction (EN+CN) | Handwriting recognition |
| Receipt field parsing (retailer, date, items) | Receipt template library |
| Category detection (keyword prefix filter) | Embedding-based category detection |
| RapidFuzz matching (three-tier confidence) | User-verified ML training loop |
| Structured JSON output | — |

### Story Breakdown

#### S3.1 — OpenCV preprocessing pipeline
- Deskew: Hough line transform, rotate to correct alignment
- Contrast: CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Denoise: Bilateral filter (preserves edges)
- Binarisation: Otsu's thresholding
- Each step configurable via env vars
- Save intermediate images when DEBUG mode enabled

#### S3.2 — PaddleOCR integration
- Load English + Chinese recognition model
- Configure detection + recognition parameters
- Process preprocessed image through PaddleOCR
- Return text blocks with bounding boxes, confidence scores
- Benchmark: process a standard receipt in < 3 seconds

#### S3.3 — Receipt field parsing
- Identify retailer name: text block at top of receipt, largest font
- Extract date: regex patterns (DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY)
- Identify total: bottom-of-receipt heuristic, amount with "$ / SGD" prefix
- Identify GST: line near total with "GST" / "Tax" keyword
- Parse line items: regex for "name quantity unit_price total" pattern
- Handle multi-line items (wrapped text on narrow receipts)
- Handle Indian provision shop receipts (frequently handwritten or non-standard format)

#### S3.4 — Category detection via keyword prefix filter
- Load category → keyword map from config file or DB (section 4.3 of architecture.md)
- Tokenize item raw_name
- Match first meaningful token against keyword prefixes (case-insensitive)
- Assign category: first match wins; fallback to "Uncategorised"
- Config file: `categories.json`, editable without redeploy
- Log categories assigned for manual audit

#### S3.5 — RapidFuzz product matching
- For each line item in detected category, fetch candidate products from comparison pool
- Run RapidFuzz token_set_ratio against each candidate
- Sort by score, select best match
- Apply confidence tier: HIGH (>85%), MEDIUM (60-85%), LOW (<60%)
- For MEDIUM confidence: include top-3 candidates in response for user confirmation
- Benchmark: match 10 items against 500-product pool in < 100ms

#### S3.6 — OCR REST API endpoints (Python FastAPI)
- POST /ocr/scan: accept { "image_url": "s3://bucket/key" } or image binary
- Download image from S3 if URL provided
- Run preprocessing → PaddleOCR → parsing → matching pipeline
- Return structured JSON (see section 4.4 of architecture.md)
- POST /ocr/health: health check + model status
- Error handling: return partial results if some items parsed but others failed

#### S3.7 — Backend: OCR orchestration endpoint (POST /bills/scan)
- Accept { "objectKey": "..." }
- Construct S3 URL, call Python OCR service internally
- Receive JSON result
- For each item with MEDIUM confidence: include top-3 candidate_matches in response
- For LOW confidence: return raw text, no match
- Return full result to mobile for review

#### S3.8 — Error handling & edge cases
- OCR fails entirely: return error, suggest manual entry
- Partial failure: return what was extracted, flag unparsed fields
- Corrupt/unsupported image: return clear error
- Timeout (>10s): return partial results if any, or error
- Python service unavailable: .NET returns 503, mobile shows retry

### Acceptance Criteria
1. PaddleOCR correctly extracts text from clean standard receipt in < 3s
2. Receipt fields parsed: retailer name, date, line items, totals
3. Category assigned to each item via keyword filter
4. RapidFuzz matches known products with confidence score
5. Three-tier confidence correctly categorised (HIGH/MEDIUM/LOW)
6. Chinese-only and mixed-language receipts handled
7. Indian provision shop non-standard receipts return partial results
8. Python service returns structured JSON matching the schema
9. .NET orchestration endpoint forwards result correctly
10. OCR failure returns graceful error, not crash

---

## Epic 4: Confirmation & Expense History

**Goal:** User reviews OCR results, corrects errors, confirms the bill. Bill data is saved to Personal Bills DB and cached locally in WatermelonDB.

**Priority:** HIGH — core user value, feeds the comparison engine

**Dependencies:** Epic 1, Epic 2, Epic 3

**Linked Threads:** T02, T16, A3

### Scope

| In | Out |
|---|---|
| OCR review screen with editable items | Bill splitting |
| Single-item edit + confirm all | Receipt image retention |
| Save to Personal Bills DB (cloud) | Bill sharing |
| WatermelonDB local cache + sync | Advanced search/filter |
| Expense list screen (paginated) | Graphs/charts (Epic 8) |
| Bill detail screen with item comparison | — |
| Zigzag-gate: confirmation mandatory for pool | — |

### Story Breakdown

#### S4.1 — Mobile: OCR review & confirm screen
- Display retailer name, date (editable)
- Item list: each row shows matched_name, qty, unit, unit_price, total, confidence tier
- HIGH confidence items: green checkmark, auto-confirmed (editable)
- MEDIUM confidence items: amber, show "Is this [Product A]? Yes / [Product B] / No"
- LOW confidence items: red, raw text shown, user must categorise manually
- Edit any field inline (tap to edit)
- "Add missing item" button
- "Delete item" swipe action
- "Confirm All" button at bottom
- Total display auto-updates as items change
- Scan of blurry receipt: show partial results, ask user to fill gaps

#### S4.2 — Mobile: Manual correction UX
- Tap item name → text input with autocomplete from product catalogue (GET /products/search)
- Tap unit_price → numeric keypad
- Tap qty → numeric keypad, increment/decrement
- Unit picker (predefined list: g, kg, ml, L, pc, pack, etc.)
- Gesture: swipe left to delete item
- Undo snackbar on delete (5-second window)

#### S4.3 — Backend: Confirm bill endpoint (POST /bills/confirm)
- Accept: objectKey + confirmed items array
- Create bill record in Personal Bills DB
- Create bill_items linked to bill
- For each item that passed confirmation gate:
  - Write to Comparison Pool DB (anonymised: canonical_name, chain, unit, unit_price, observed_month)
  - UPSERT into prices table (increment receipt_count if price matches)
- Delete S3 object (immediate, via AWS SDK)
- Return bill ID + summary
- User's community_contribution flag checked before writing to Comparison Pool

#### S4.4 — Backend: CRUD endpoints for bills
- GET /bills: paginated bill list for authenticated user
  - Cursor-based pagination (after_id), page_size default 20
  - Filter by date range, retailer
  - Return: [ { id, retailer_name, total, item_count, confirmed_at } ]
- GET /bills/{id}: full bill detail with all items
  - Include comparison data for each item (price tiers from comparison pool)
- DELETE /bills/{id}: soft-delete, remove contributions from comparison pool

#### S4.5 — WatermelonDB: local sync
- On app launch (after auth): pull all bills + items from cloud
- Incremental sync: pull bills updated since last sync timestamp
- On confirm: write bill optimistically to local DB, sync to cloud, mark synced
- On delete: soft-delete locally, sync to cloud
- Conflict handling: cloud always wins (most recent confirmed_at)
- Sync adapter implemented on WatermelonDB schema from S0.3

#### S4.6 — Mobile: Expense list screen
- FlatList with pagination (load more on scroll)
- Each row: date, retailer name, total, item count
- Swipe left to delete
- Tap row → Bill Detail screen
- Pull-to-refresh triggers sync
- Empty state: "No bills yet. Scan your first receipt!"
- Skeleton loading while syncing

#### S4.7 — Mobile: Bill detail screen
- Header: retailer name, outlet, date, total, GST
- Item list with comparison color indicators (green/grey/amber/red)
- Each item row: name, qty, unit_price, total, color dot
- Tap item → expand: "Available for less at X" or "No comparison data yet"
- No data state: grey dot + "Not enough data to compare yet"

### Acceptance Criteria
1. User sees OCR results with confidence-tier indicators
2. User can edit any field on any item
3. User can add/delete items
4. "Confirm All" saves bill to cloud + local cache
5. Confirmed items with consent are written to Comparison Pool
6. S3 image deleted after confirm
7. Expense list loads from cloud on app launch
8. Offline access: cached bills visible without network
9. Pagination works correctly (cursor-based)
10. Bill detail shows comparison colors for items with data
11. Deleted bill removes contributions from comparison pool

---

## Epic 5: Comparison Engine

**Goal:** Given a confirmed item, find the best available price across all retailer chains using 30-day (or 60-day fallback) price data and return a color-tier comparison.

**Priority:** HIGH — the app's core differentiator

**Dependencies:** Epic 4 (needs confirmed items in comparison pool), Epic 3 (product matching)

**Linked Threads:** T01, T02, T07, T14, A6

### Scope

| In | Out |
|---|---|
| Price lookup with 30-day window | Price prediction / forecasting |
| Color-tier comparison (green/grey/amber/red) | Basket optimisation algorithm |
| Chain-level comparison display | Outlet-level display (data collected for future) |
| "Based on N receipts, last X days ago" trust indicators | Price change alerts |
| Neutral framing ("available for less at X") | Historical price charts |
| Outlet-level data collection (for future display) | — |

### Story Breakdown

#### S5.1 — Backend: Price lookup service
- Input: product_id, unit, unit_price, chain_id (user's purchase chain)
- Query: find all prices for this product in last 30 days across all chains
- Fallback: if no 30-day data, extend to 60 days (flag as "older data")
- Find minimum unit_price across all chains
- Calculate percentage difference: ((user_price - min_price) / min_price) * 100
- Assign color tier based on thresholds (section 6 of architecture.md)
- Return: { tier, color, min_price, min_chain, savings_amount, receipt_count, last_observed }

#### S5.2 — Backend: GET /compare/item endpoint
- Accept: product_id (canonical item ID from OCR matching)
- Call price lookup service
- Return comparison data for all chains with prices
- Sort chains by price (cheapest first)
- Include outlet-level data where available (stored, not displayed in MVP)
- Cached response (Redis or in-memory) — price data changes slowly, TTL = 1 hour

#### S5.3 — Backend: POST /compare/basket endpoint
- Accept: array of { product_id, unit_price, chain_id } (user's purchase)
- Run price lookup for each item
- Compute total potential savings per chain
- Return: per-item comparisons + aggregate savings summary
- Summary: "Shopping at [Best Chain] would save you $X on this basket"

#### S5.4 — Mobile: Compare screen
- "Compare Prices" tab in bottom nav
- Search bar: type product name, autocomplete from product catalogue
- Result: list of chains with prices, cheapest highlighted green
- Below each chain: price, savings/extra cost, last observed date
- "No data" state: "Not enough receipts yet. Contribute yours to help!"
- Tap chain → Chain Detail: outlet-level prices (future scope placeholder)

#### S5.5 — Mobile: Bill detail comparison integration
- After confirming a bill, each item row shows color dot
- Tap item → expand to show "Available for less at [Chain]" or "Best price found"
- Display N receipts contributing to comparison
- Display "Last observed X days ago"
- Items with no comparison data: neutral state, "No comparison data yet"

#### S5.6 — Comparison framable text policy (backend + mobile)
- Backend: comparison response must use neutral language only
- Mobile: all comparison text sourced from backend (no hardcoded judgment words)
- Prohibited: "expensive", "overpriced", "ripoff", "bad value", "avoid"
- Template: "[Chain 1] — $X.XX per [unit] — Available for less at [Chain 2]: $Y.YY per [unit]"
- Trust line: "Based on N receipts. Last reported X days ago."

### Acceptance Criteria
1. Price lookup returns comparison across all chains with valid data
2. 30-day primary window, 60-day fallback with "older data" flag
3. Color tier correctly assigned based on thresholds
4. Basket comparison returns aggregate savings
5. Compare screen displays searchable product list with chain prices
6. Bill detail items show color dots linked to comparison data
7. No comparison data items show neutral state, not broken UI
8. All comparison text uses neutral "available for less at" framing
9. Trust indicators (N receipts, days ago) displayed on every comparison
10. Outlet-level data collected in DB, not displayed in MVP

---

## Epic 6: Crowdsourced Pool & Seed Data

**Goal:** The comparison pool is populated with initial seed data so day-one users get useful comparisons. The anonymised contribution pipeline is verified end-to-end.

**Priority:** HIGH — mitigates cold start, validates the core data flywheel

**Dependencies:** Epic 4 (confirmation pipeline), Epic 5 (comparison queries against pool)

**Linked Threads:** T04, T05, T08, T11, T16

### Scope

| In | Out |
|---|---|
| Seed data: 50 staples × 6 chains | Automated web scraping for prices |
| CSV-to-JSON price formatting/validation script | FMCG/retailer data partnerships |
| Idempotent seed data loader | Data quality monitoring dashboard |
| Anonymisation verified in confirm endpoint (S4.3) | — |
| Contribution consent gate | — |
| UPSERT logic for new prices | — |

### Story Breakdown

#### S6.2 — Seed price data formatting script
- Script that takes collected price data (CSV) and converts to validated seed-prices.json
- Validates each row: product name matches seed-data.json, chain is known retailer, price positive, month YYYY-MM
- Reports validation errors with row numbers
- Dedupes identical (product, chain, outlet, month, price) entries
- Example CSV template included for field researchers
- Output: validated seed-prices.json ready for S6.3 loader

#### S6.3 — Seed data definition & loader script
- Define top 50 staple items across categories (see categories in section 4.3 of architecture.md)
- Each item: canonical_name, category, typical_unit, aliases for fuzzy matching
- Categories: Rice, Cooking Oil, Eggs, Milk, Bread, Chicken (fresh), Vegetables (5 common), Fruits (5 common), Noodles, Sugar, Salt, Tea, Coffee, Biscuits, Detergent, Soap, Tissue, etc.
- Output file: seed-data.json with 50 product definitions
- Script that reads seed-data.json + seed-prices.json and inserts into comparison pool
- Inserts products (UPSERT by canonical_name), chains, outlets, prices with source='manual_seed'
- Idempotent: can be run multiple times without duplicates
- Run as part of db:seed or separate CLI command

#### S6.5 — Consent gate enforcement
- Before writing to comparison pool, check user.community_contribution flag
- If false: skip pool write (bill saved to personal DB only)
- If user changes consent to false: do NOT retroactively remove existing contributions (optional policy decision — document and align)
- Contribution status visible in Settings

#### S6.6 — UPSERT deduplication logic
- When a new confirmed price arrives for same (product, chain, month, price):
  - Increment receipt_count
  - Update last_observed to current month
- When price differs from existing entry for same (product, chain, month):
  - Insert new row (prices can vary within a month — promotions, different outlets)
- Outlet-level: separate row per outlet

### Acceptance Criteria
1. 50 staple items + prices for 6 chains loaded into comparison pool
2. Seed data loader is idempotent (no duplicates on re-run)
3. Price formatting script validates and transforms CSV to valid seed-prices.json
4. Confirmed bill item appears in prices table with no user linkage
5. prices table contains NO user_id, bill_id, or full date fields
6. S3 image deleted after confirm, no residual image data anywhere
7. User with community_contribution=false does NOT write to pool
8. Multiple receipts for same (product, chain, month, price) increment receipt_count
9. Different prices for same product correctly create separate entries

---

## Epic 7: Freemium Gating

**Goal:** Scan quota enforcement, premium feature toggles, and tier display. Gating is structurally present from day 1.

**Priority:** MEDIUM — structural gate needed early, enforcement can be lenient

**Dependencies:** Epic 1 (auth), Epic 4 (bill scanning)

**Linked Threads:** T09, T22

### Scope

| In | Out |
|---|---|
| Free tier: 10 scans/month + 20 comparisons/month | Payment integration (manual premium assignment for MVP) |
| Scan + comparison counters with monthly SGT reset | Subscription management portal |
| Premium flag on user entity | Trial periods |
| Quota display + premium upsell in UI | — |
| Tier comparison table (Free vs Premium vs Founder) | — |

### Story Breakdown

#### S7.2 — Monthly quota enforcement: scans + comparisons (backend)
- Add tier field to User entity: 'free' | 'premium' | 'founder'
- Add scans_this_month + comparisons_this_month counters with reset timestamps
- Premium features bitmap or feature flags: { unlimited_scans, full_history, unlimited_comparison, spending_trends, data_export }
- Migration: default all new users to 'free'
- On /bills/scan request: check scans_this_month; if month changed, reset; if at quota AND free, return 402
- On /compare/* requests: check comparisons_this_month; same reset logic; if at quota AND free, return 402
- Premium and founder users: skip all quota checks entirely
- Counter increments: scans on POST /bills/confirm only; comparisons on compare endpoint responses
- SGT timezone for month boundary detection — shared reset logic for both counters

#### S7.4 — Mobile: Quota display & premium upsell
- Home screen: "X/10 scans remaining this month" with progress bar
- Compare tab: comparison count display
- At 0 scans: scan FAB disabled, quota-exhausted banner shown
- Exhausted state: inline tier comparison table (Free vs Premium vs Founder)
- Premium features listed (unlimited scans, full history, unlimited comparisons, spending trends, data export)
- "Upgrade to Premium" button (placeholder — no payment integration for MVP)
- Current tier highlighted; Founder tier shown with "Current plan" badge
- Upsell also accessible from Settings for proactive discovery
- No quota shown for premium/founder users (or "Unlimited" badge)

### Acceptance Criteria
1. Free user is blocked from scanning after 10 confirmed bills in a month
2. Scan counter resets on the 1st of each month
3. Premium user has no scan limit
4. Premium toggle works, toggling user tier
5. Quota display shows remaining scans on home screen
6. At-quota state shows upsell screen, not broken UI
7. Founder tier has all premium features, no expiry
8. Monthly counter reset is timezone-aware (SGT)

---

## Epic 8: Settings, Profile & Polish

**Goal:** User settings, consent management, app configuration, and UI polish for MVP readiness.

**Priority:** MEDIUM — needed for production readiness

**Dependencies:** Epics 1, 4, 5, 7

**Linked Threads:** T08, T11

### Scope

| In | Out |
|---|---|
| Settings + profile screen (email, mobile, tier, creation date) | Full account deletion (future) |
| GET/PATCH /user/profile endpoints with audit logging | Push notification settings |
| Consent toggles (2 checkboxes) | Theme/dark mode (future) |
| App version + build info | Data export (future — premium) |
| Privacy policy + terms links | — |
| Empty states + error states for all screens | — |
| Loading skeletons | — |

### Story Breakdown

#### S8.1 — Mobile: Settings & profile screen (+ backend endpoints)
- Header: app name + version
- Sections:
  - Account: email, mobile (read-only), Google account linked indicator
  - Profile: display name, account creation date, tier badge (Free/Premium/Founder), "Manage Subscription" link → upsell (S7.4)
  - Privacy: two consent toggles (community contribution, marketing — future)
  - About: privacy policy link, terms of service link, version, build number
  - Danger zone: delete all my data (future scope)
- Tap to edit mobile number (inline)
- Tap privacy policy → in-app webview or external browser
- Backend: GET /user/profile (email, mobile, google_linked, tier, created_at)
- Backend: PATCH /user/profile (update mobile number with audit log)
- Mobile validation: Singapore format

#### S8.2 — Mobile: Consent toggle behaviour
- Toggle community contribution ON → immediate effect
- Toggle OFF → confirmation dialog: "Your existing contributions will remain in the pool but no new data will be added. Continue?"
- Toggle state fetched from backend, synced on change
- Backend: PATCH /user/consent with consent audit log

#### S8.5 — Mobile: Loading & error state sweep
- Every API call: show skeleton/spinner during load, error state on failure
- Skeleton components: expense list rows, bill detail, comparison items
- Error states with retry: network error, server error, auth failure
- Network connectivity listener: show offline banner when disconnected
- Empty states for all list screens (no bills, no comparison data)

#### S8.6 — Mobile: First-launch onboarding
- 3-screen onboarding (skippable, shown once):
  1. "Scan your grocery receipts" — camera animation
  2. "Track your spending" — expense list animation
  3. "Find better prices" — comparison animation
- User understands the app's 3 core features before signing up
- Swipe between screens at own pace; dot indicators track position
- "Get Started" → account creation
- Shown only on first install (AsyncStorage flag)

### Acceptance Criteria
1. Settings screen shows account info, consent toggles, app version
2. Community contribution toggle updates consent on backend
3. Toggle OFF shows confirmation dialog
4. Sign out clears tokens and returns to login
5. Loading skeletons shown on all async screens
6. Error states show retry option on all screens
7. Empty states shown for no-data scenarios
8. Onboarding shown on first launch, skippable, never shown again

---

## Dependency Graph

```
Pre-Dev (Reorg) ──────────────────────────────────────────────────────────┐
      │                                                                    │
Epic 0 (Scaffold) ────────────────────────────────────────────────────┐   │
     │                                                               │   │
     ├── Epic 1 (Auth) ──────────────────────────────────────────┐   │   │
     │       │                                                    │   │   │
     │       ├── Epic 2 (Capture) ──┬── Epic 3 (OCR) ──┐         │   │   │
     │       │                      │                   │         │   │   │
     │       │                      └── Epic 4 (Confirm & History) │   │   │
     │       │                               │                     │   │   │
     │       │                               ├── Epic 5 (Compare)  │   │   │
     │       │                               │        │            │   │   │
     │       │                               ├── Epic 6 (Pool)     │   │   │
     │       │                               │                     │   │   │
     │       └── Epic 7 (Freemium) ──────────┘                     │   │   │
     │                                                              │   │   │
     └── Epic 8 (Settings & Polish) ───────────────────────────────┘   │   │
```

### Parallel work possible:
- **Pre-Dev Reorg** must complete first — all stories depend on the monorepo structure
- Epics 0, 1 (auth) can start immediately after reorg
- Epics 2 (capture) and Epic 3 (OCR) can be developed in parallel after Epic 1
- Epic 5 (comparison) depends on Epic 4, can start once confirmation flow is stable
- Epic 6 (seed data) can start early — seed data script is independent
- Epic 8 (settings/polish) can start after Epic 1, evolves alongside all epics
