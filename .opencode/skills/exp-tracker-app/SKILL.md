---
name: exp-tracker-app
description: Use when user asks about what this app does, product overview, architecture, tech stack, MVP scope, privacy model, or any high-level question about expTracker. Use when planning features, making design decisions, or understanding how components fit together. Use ONLY when the question relates to the expTracker product itself.
---

# ExpTracker — App Overview

## What It Is

ExpTracker is a mobile app for Singapore residents to scan grocery receipts, track personal spending, and instantly see whether the items they bought are available for less at a different supermarket chain.

It is explicitly **not** a generic expense tracker or budgeting app. It is built around one insight: in Singapore, the same grocery item can differ by 20–40% in price across chains, and most people have no easy way to know this at the time they shop.

## Core Flow

```
Scan receipt → Review OCR output → Confirm → Expenses saved
                                              ↓
                                 Anonymised price data contributed
                                 to shared comparison pool
                                              ↓
                                 "This item is available for less
                                  at Sheng Siong"
```

1. **Scan** — point phone camera at any grocery receipt. OCR extracts every line item.
2. **Confirm** — review extracted items, correct errors, save. Personal expense history stored privately.
3. **Compare** — confirmed item prices checked against crowdsourced comparison pool. Color-tier indicators show price differences across chains.
4. **Contribute** — confirmed prices (stripped of all personal identifiers) added to shared pool.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (bare, no Expo), react-native-vision-camera v3+ |
| Navigation | React Navigation v6, Bottom Tab + 4 Stack Navigators |
| State | Zustand (4 slices: auth, scan, expenses, compare) |
| Local DB | WatermelonDB (reactive, lazy loading, offline sync) |
| Backend API | .NET 10, ASP.NET Core, C# |
| Database | PostgreSQL 16 (two DBs: Personal Bills + Comparison Pool) |
| ORM | EF Core 10 + Npgsql |
| Auth | ASP.NET Core Identity + JWT + Google Sign-in |
| OCR Service | Python FastAPI, OpenCV, PaddleOCR (EN+CN), RapidFuzz |
| Image Storage | AWS S3 ap-southeast-1 (temp, 2-hr TTL lifecycle); dev uses S3Ninja |
| Cloud | AWS (ECS Fargate for prod), zero AWS dependency for dev |
| Dev Env | Docker Compose: PG 16, .NET API, Python OCR, S3Ninja |

## Architecture Diagram

```
React Native App (bare)
  Zustand | WatermelonDB | React Navigation v6
  Camera → On-device blur check → Upload → Review → Confirm
         │ HTTPS / REST (JWT)
         ▼
.NET 10 Backend API
  ASP.NET Identity | JWT + Google | Bills API | Comparison API
  Image Upload Handler | S3 Pre-signed URLs
    │ HTTP (internal VPC)                  │
    ▼                                      ▼
Python OCR Microservice          Temp Image Storage (S3)
  FastAPI | OpenCV →             Dev: S3Ninja | Prod: AWS S3
  PaddleOCR →                    2-hr TTL | Success: immediate delete
  Category filter → RapidFuzz
    │ returns structured JSON
    ▼
Two-Database Architecture (PostgreSQL 16)
  [Personal Bills DB]          [Comparison Pool DB]
  Linked to user account       Anonymised — no user linkage
  Private, PDPA-governed       Outside PDPA scope
```

## Two-Database Architecture

| Aspect | Personal Bills DB | Comparison Pool DB |
|---|---|---|
| Linked to user | Yes | No |
| Contains PII | Yes (email, mobile) | No |
| PDPA scope | In scope | Outside scope (fully anonymised) |
| Stores | users, bills, bill_items, retailers, refresh_tokens | categories, products, retail_chains, prices, outlets |
| Source | Direct from user scans | Confirmed items from user scans + manual seed data |

## Navigation Structure

```
BottomTabNavigator
  ├── HomeStack       (Home → ScanReceipt → ConfirmOCR)
  ├── ExpensesStack   (ExpenseList → BillDetail)
  ├── CompareStack    (CompareHome → ItemDetail)
  └── SettingsStack   (Settings → Profile)
```

## OCR Processing Pipeline

1. Receive image (binary or S3 URL)
2. OpenCV preprocessing: deskew → CLAHE contrast → bilateral denoise → Otsu binarisation
3. PaddleOCR — extract raw text blocks (English + Chinese models)
4. Post-processing: parse line items (name, qty, unit, unit_price, total), identify retailer + date
5. Category detection via keyword prefix filter
6. RapidFuzz matching against known items (three-tier confidence: HIGH >85%, MEDIUM 60-85%, LOW <60%)
7. Return structured JSON to .NET backend → served to mobile for user review

## Comparison Engine — Color Tiers

| Tier | Color | Threshold vs Lowest Price (30-day) |
|---|---|---|
| Good Deal | Green | ≤ 5% above lowest |
| Typical | Grey | 5–15% above lowest |
| Moderate High | Amber | 15–30% above lowest |
| Very High | Red | > 30% above lowest |
| No Data | Neutral | Insufficient comparison data |

**Framing rule:** NEVER use "expensive/overpriced/rip-off/avoid" — always "available for less at [Retailer]".

## Zustand Store Slices

| Slice | Purpose |
|---|---|
| `auth` | User session, JWT, refresh token, login state |
| `scan` | Camera state, captured image URI, upload progress, OCR result, confirmation state |
| `expenses` | Cached bill list, pagination cursor |
| `compare` | Comparison results for current items, loading state |

## Privacy Model

- **Personal bills** stored privately, user-controlled
- **Comparison pool** contains only: item name, price, unit, retailer chain, month/year — no user ID, bill ID, or full date
- **Receipt images** deleted immediately after OCR confirmed (max 2-hour TTL)
- **No data selling** — comparison pool is a shared utility, not a monetisation asset
- **Consent:** two checkboxes at signup (personal tracking = required; community contribution = optional, default ON)
- **Regulation:** PDPA compliance for Singapore

## MVP Scope

**In MVP:**
- Singapore only, Android + iOS
- Grocery receipts (6 chains: NTUC FairPrice, Sheng Siong, Cold Storage, Giant, Don Don Donki, Indian provision shops)
- OCR: English + Chinese receipt support
- Chain-level price comparison (outlet-level data collected but not displayed)
- Color-tier indicators with "available for less at X" framing
- Freemium from day 1 (10 scans/month free)
- Manual seed data: 50 staples across all 6 chains
- Confirmation gate mandatory for comparison pool contribution
- On-device blur detection before upload

**Out of MVP:**
- Outlet-level comparison display
- Budget tracking / spending alerts
- Category auto-tagging by AI
- Data export (CSV/PDF)
- Multi-currency
- Web dashboard
- Retailer partnerships / sponsored placements
- Non-grocery categories

## Business Model

Freemium from launch:

| Tier | Features |
|---|---|
| Free | 10 scans/month, basic expense list, limited comparison queries |
| Premium (paid) | Unlimited scans, full history, full comparison, spending trends, export |

Gating is structural from day 1 — no "free now, paid later" transition.

## Key Files (read for deeper context)

| File | Content |
|---|---|
| `docs/architecture.md` | Full system architecture, DB schemas, data flow, infrastructure |
| `docs/product-overview.md` | Product concept, problem/solution, competitors, revenue model |
| `docs/epics.md` | Epics 0-8 with story breakdowns, dependencies, acceptance criteria |
| `docs/open-questions.md` | Historical Q&A on scope, privacy, technical, business decisions |
| `docs/decisions/*.json` | Individual decision records with AI+user discussion threads |
| `stories/epic-*/` | Detailed story files per epic |
