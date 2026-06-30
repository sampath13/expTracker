---
name: monorepo-structure
description: Use when creating, moving, or refactoring files/directories in this repo, when scaffolding new apps or packages, or when user asks about folder structure, project organization, or "where should X go". Defines the monorepo layout conventions.
---

# Monorepo Structure

Target layout for the `expTracker` monorepo. Pattern: **Turbo-adapted `apps/` + `packages/`** (language-agnostic, multi-runtime).

## Directory Layout

```
expTracker/
├── apps/                          # Deployable applications & services
│   ├── mobile/                    # React Native (bare) — the expTracker mobile client
│   │   ├── src/
│   │   │   ├── screens/           # Screen components (one per route)
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── navigation/        # React Navigation v6 config (stacks, tabs, types)
│   │   │   ├── store/             # Zustand store slices (auth, scan, expenses, compare)
│   │   │   ├── db/                # WatermelonDB schema, models, sync adapter
│   │   │   ├── services/          # API client, auth interceptors
│   │   │   ├── hooks/             # Custom hooks (useAuth, useCamera, usePermissions)
│   │   │   ├── utils/             # Pure utilities (blur detection, formatters)
│   │   │   ├── constants/         # App constants (colors, config)
│   │   │   ├── types/             # Shared TypeScript types
│   │   │   └── theme/             # Styling tokens
│   │   ├── __tests__/             # Jest + RNTL (mirrors src/ structure)
│   │   ├── android/
│   │   ├── ios/
│   │   ├── App.tsx                # Root: providers, navigation container
│   │   ├── index.js
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── metro.config.js
│   │   ├── babel.config.js
│   │   └── jest.config.js
│   │
│   ├── api/                          # .NET 10 backend (3-tier solution)
│   │   ├── ExpTracker.sln
│   │   ├── src/
│   │   │   ├── ExpTracker.Api/        # Presentation layer
│   │   │   │   ├── Controllers/       # AuthController, BillsController, CompareController
│   │   │   │   ├── Middleware/        # JWT auth, error handling
│   │   │   │   ├── Extensions/
│   │   │   │   ├── Program.cs
│   │   │   │   ├── appsettings.json
│   │   │   │   ├── appsettings.Development.json
│   │   │   │   └── ExpTracker.Api.csproj
│   │   │   ├── ExpTracker.Core/       # Business logic layer
│   │   │   │   ├── Services/          # PriceLookupService, OcrOrchestrationService
│   │   │   │   ├── Interfaces/        # IS3Service, ITokenService, IPriceLookupService
│   │   │   │   ├── Models/            # DTOs, request/response types
│   │   │   │   ├── DependencyInjection.cs
│   │   │   │   └── ExpTracker.Core.csproj
│   │   │   └── ExpTracker.Infrastructure/  # Data + external services
│   │   │       ├── Data/              # PersonalBillsDbContext, ComparisonPoolDbContext
│   │   │       │   └── Migrations/
│   │   │       ├── Services/          # S3Service, TokenService, GoogleAuthService
│   │   │       ├── Configurations/    # EF Core Fluent API entity configs
│   │   │       ├── DependencyInjection.cs
│   │   │       └── ExpTracker.Infrastructure.csproj
│   │   └── tests/
│   │       ├── ExpTracker.Api.Tests/
│   │       ├── ExpTracker.Core.Tests/
│   │       └── ExpTracker.Infrastructure.Tests/
│   │
│   ├── ocr-service/               # Python FastAPI OCR microservice (src-layout)
│   │   ├── src/
│   │   │   └── ocr_service/
│   │   │       ├── __init__.py
│   │   │       ├── main.py        # FastAPI app, lifespan, include_routers
│   │   │       ├── config.py      # pydantic-settings BaseSettings
│   │   │       ├── api/            # Thin route handlers (APIRouter)
│   │   │       │   ├── __init__.py
│   │   │       │   ├── router.py
│   │   │       │   └── scan.py
│   │   │       ├── schemas/        # Pydantic request/response models
│   │   │       │   ├── __init__.py
│   │   │       │   └── scan.py
│   │   │       ├── services/       # Business logic (stateless)
│   │   │       │   ├── preprocessing/  # OpenCV (deskew, CLAHE, bilateral, Otsu)
│   │   │       │   ├── ocr/            # PaddleOCR engine
│   │   │       │   ├── parsing/        # Receipt field extraction
│   │   │       │   └── matching/       # RapidFuzz + category filter
│   │   │       └── core/           # Cross-cutting (exceptions)
│   │   ├── tests/
│   │   │   ├── conftest.py
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── fixtures/
│   │   ├── data/
│   │   │   └── categories.json    # Category → keyword prefix map
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── threader/                  # Decision-thread viewer (research tool)
│       ├── src/                   # React frontend (Vite)
│       │   ├── components/
│       │   ├── data/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       ├── server.js              # Express server (serves /threads)
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── .env.example
│
├── docker/                        # Container & dev-environment configs
│   ├── docker-compose.yml         # PG 16 + API + OCR + S3Ninja
│   ├── postgres/
│   │   └── init.sql               # Initial DB setup scripts
│   └── s3ninja/
│       └── (s3ninja config)
│
├── docs/                          # Project documentation (root docs + architecture)
│   ├── architecture.md
│   ├── product-overview.md
│   ├── epics.md
│   └── open-questions.md
│
├── stories/                       # Story breakdowns per epic (consumed by agents)
│   ├── epic-0-scaffold/
│   ├── epic-1-auth/
│   ├── epic-2-capture/
│   ├── epic-3-ocr/
│   ├── epic-4-confirm/
│   ├── epic-5-compare/
│   ├── epic-6-pool/
│   ├── epic-7-freemium/
│   └── epic-8-polish/
│
├── threads/                       # Decision records (JSON, consumed by threader app)
│   ├── 01-product-scope.json
│   ├── 02-cold-start.json
│   ├── 03-geography-market.json
│   ├── 04-privacy-consent.json
│   ├── 05-retailer-relationship.json
│   ├── 06-ocr-accuracy.json
│   ├── 07-technical-mobile.json
│   ├── 08-technical-backend.json
│   ├── 09-business-model.json
│   ├── 10-regulatory.json
│   └── 11-architecture.json
│
├── scripts/                       # Root-level utility scripts
│   └── seed/
│       ├── seed-data.json         # 50 staple product definitions
│       ├── seed-prices.json       # Prices across 6 retailer chains
│       └── load-seed.py           # Idempotent DB seed loader
│
├── .github/                       # CI/CD
│   └── workflows/
│       ├── ci-mobile.yml
│       ├── ci-api.yml
│       ├── ci-ocr.yml
│       └── ci-threader.yml
│
├── .opencode/                     # OpenCode configuration
│   └── skills/
│       └── monorepo-structure/
│           └── SKILL.md           # This file
│
├── .gitignore
├── README.md
└── .monorepo-structure.md         # Human-readable version of this layout
```

## Rationale

| Decision | Why |
|---|---|
| `apps/` for deployables | Turborepo/Nx convention. Each subdirectory is a self-contained unit with its own build, test, and deploy lifecycle. Clear distinction from shared code. |
| `apps/threader/` lives alongside production apps | The threader is a research/visibility tool that consumes `threads/`. It belongs in the monorepo as a first-class application, not hidden in a `tools/` ghetto. |
| `docs/` for architectural docs | Keeps root clean. Documentation is versioned alongside code. |
| `stories/` at root (not under `docs/`) | Stories are work-in-progress execution plans consumed by AI coding agents. They evolve rapidly and are referenced directly in implementation workflows. |
| `threads/` at root | Threader's Express server serves `threads/` from the repo root. Moving would break the viewer. Content is stable decision records, not docs. |
| `docker/` at root | Single source of truth for container config. Avoids duplication across services. |
| `scripts/` at root | Cross-cutting utility scripts (seed data loader) that span multiple services. |
| No `packages/` yet | No shared libraries currently exist. Add `packages/` when a shared package emerges (e.g., `shared-types`, `eslint-config`, shared Python utilities). |
| No root `package.json` or workspace config | Multi-runtime repo (JS, C#, Python). A root `package.json` would be misleading. Each app manages its own dependencies. Exception: if future JS shared packages exist, add a `package.json` + `pnpm-workspace.yaml` scoped to `apps/` + `packages/` containing only JS projects. |

## Migration Map (Current → Target)

| Current Path | Target Path |
|---|---|
| `architecture.md` | `docs/architecture.md` |
| `epics.md` | `docs/epics.md` |
| `product-overview.md` | `docs/product-overview.md` |
| `open-questions.md` | `docs/open-questions.md` |
| `stories/` | `stories/` (path unchanged) |
| `threads/` | `threads/` (path unchanged) |
| `threader/` | `apps/threader/` |
| *(new)* | `apps/mobile/` (scaffold React Native) |
| *(new)* | `apps/api/` (scaffold .NET 10) |
| *(new)* | `apps/ocr-service/` (scaffold FastAPI) |
| *(new)* | `docker/` |
| *(new)* | `scripts/` |
| *(new)* | `.github/` |

## Migration Steps (when restructure is requested)

1. Create directories: `apps/`, `docker/`, `docs/`, `scripts/`
2. Move docs: `architecture.md`, `epics.md`, `product-overview.md`, `open-questions.md` → `docs/`
3. Move threader: `threader/` → `apps/threader/`
   - **Critical:** Update `apps/threader/server.js:11` from `path.join(__dirname, '..', 'threads')` to `path.join(__dirname, '..', '..', 'threads')` so the Express server can still find `threads/` from its new nested location.
   - Verify `npm run dev` still works from `apps/threader/`
4. `stories/` and `threads/` — keep at current location (paths unchanged)
5. Scaffold empty apps — create `apps/mobile/`, `apps/api/`, `apps/ocr-service/` with base project configs per Epic 0
6. Create `docker/` — move Docker Compose + configs here
7. Create `scripts/seed/` — seed data and loader script
8. Create `.github/workflows/` — CI workflow files
9. Verify — run threader, ensure docker compose works, ensure all relative paths resolve

## Conventions for Adding New Files

- **New deployable app** → `apps/<name>/` with its own `package.json` / `*.csproj` / `requirements.txt`
- **New shared JS/TS library** → `packages/<name>/` with its own `package.json`; add workspace config at root
- **New shared Python library** → `packages/<name>/` with its own `pyproject.toml` or `setup.py`
- **New documentation** → `docs/<name>.md`
- **New story breakdown** → `stories/epic-<N>-<name>/`
- **New decision record** → `threads/<NN>-<topic>.json` (two-digit prefix, kebab-case)
- **New cross-cutting script** → `scripts/<name>/`
- **Infrastructure/docker changes** → `docker/`
- **CI changes** → `.github/workflows/`
