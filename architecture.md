# ExpTracker — System Architecture

> Living document. Last updated based on threads T18–T21 and all prior Q&A.
> Open questions tracked in `threads/11-architecture.json`.

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App (bare)                   │
│  Camera → Receipt Scan → Confirm → Expense List → Compare   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   .NET Backend API                           │
│  Auth │ Bills API │ Comparison API │ Image Upload Handler    │
└──────┬──────────────────────────────────────┬───────────────┘
       │ HTTP (internal)                      │
       ▼                                      ▼
┌──────────────────┐             ┌────────────────────────────┐
│  Python OCR      │             │  Cloud Storage (temp)      │
│  Microservice    │             │  AWS S3 ap-southeast-1     │
│  FastAPI         │             │  or Azure Blob SE Asia     │
│  OpenCV +        │             │  2-hr TTL lifecycle policy │
│  PaddleOCR       │             └────────────────────────────┘
└──────────────────┘
       │ returns structured JSON (items, prices, retailer)
       │
┌──────┴───────────────────────────────────────────────────────┐
│                   Two-Database Architecture                   │
│                                                               │
│  [Personal Bills DB]          [Comparison Pool DB]            │
│  Linked to user account       Anonymised — no user linkage    │
│  Private                      Shared, read by all users       │
│  PDPA-governed                Outside PDPA scope              │
│  Stores: bill, items,         Stores: item name, price,       │
│  amounts, date, retailer      unit, retailer chain,           │
│                               month/year only                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Mobile App (React Native — Bare)

### 2.1 Decided
| Concern | Decision | Source |
|---|---|---|
| Framework | Bare React Native (no Expo) | T18 |
| Camera library | react-native-vision-camera v3+ | T18 |
| Permissions | react-native-permissions | T19 |
| Local image lifecycle | Delete from device cache once upload completes | T21 |

### 2.2 Open Questions
See `threads/11-architecture.json` → threads A1, A2, A3.

- **Navigation**: React Navigation (Stack + Bottom Tabs) — to be confirmed
- **State management**: Zustand vs Redux Toolkit vs Context
- **Local bill storage**: SQLite (react-native-sqlite-storage) vs AsyncStorage vs local-first sync

### 2.3 Planned Screen Flow
```
Launch
  └─ Auth (Login / Register)
       └─ Home (expense summary + quick-scan FAB)
            ├─ Scan Receipt
            │    ├─ Camera capture
            │    ├─ OCR result review / confirm
            │    └─ Save → back to Home
            ├─ Expense List
            │    └─ Bill Detail
            ├─ Compare Prices
            │    └─ Item price comparison (chain-level, MVP)
            └─ Settings / Profile
```

---

## 3. .NET Backend API

### 3.1 Decided
| Concern | Decision |
|---|---|
| Language / runtime | C# / .NET (version TBD — see A4) |
| Responsibility | Auth, bill CRUD, comparison DB writes, orchestrates OCR call |
| OCR call pattern | Upload image to temp cloud storage → call Python service → receive JSON → serve to mobile for confirmation → on confirm: write to DBs + delete temp image |
| Communication to Python | HttpClient → FastAPI endpoint (internal network / VPC) |

### 3.2 Planned API Surface (MVP)

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh

POST   /bills/upload-image        → returns temp image URL + pre-signed upload
POST   /bills/scan                → triggers OCR, returns line items for review
POST   /bills/confirm             → saves confirmed bill, deletes temp image
GET    /bills                     → paginated bill list
GET    /bills/{id}                → bill detail with items

GET    /compare/item?name={name}  → price comparison for item across chains
```

### 3.3 Open Questions
See `threads/11-architecture.json` → threads A4, A5.

- .NET version (8 LTS vs 9)
- Database for personal bills (PostgreSQL vs SQL Server)
- Auth approach (ASP.NET Identity + JWT vs Cognito vs Firebase Auth)
- Deployment target (Docker on ECS vs Azure Container Apps vs bare VM)

---

## 4. Python OCR Microservice

### 4.1 Decided
| Concern | Decision | Source |
|---|---|---|
| Web framework | FastAPI | T20 |
| Preprocessing | OpenCV | T20 |
| OCR engine | PaddleOCR (preferred over Tesseract) | Prior Q&A |
| Stateless | Yes — no session state, independently scalable | T20 |
| Fuzzy matching | RapidFuzz — three-tier confidence | Prior Q&A |
| Confidence tiers | >85% auto-match, 60–85% ask user, <60% treat as new | Prior Q&A |

### 4.2 Processing Pipeline
```
1. Receive image (binary or URL)
2. OpenCV preprocessing
   a. Deskew (Hough line transform)
   b. Contrast enhancement (CLAHE)
   c. Noise reduction (bilateral filter)
   d. Binarisation (Otsu's threshold)
3. PaddleOCR — extract raw text blocks
4. Post-processing
   a. Parse line items: name | qty | unit | unit price | total
   b. Identify retailer name (top of receipt)
   c. Identify date
   d. RapidFuzz matching against known item names in comparison pool
5. Return structured JSON:
   {
     "retailer": "NTUC FairPrice",
     "date": "2024-10-15",
     "items": [
       { "raw": "SUNSHINE WHT BRD 600G", "matched_name": "Sunshine White Bread 600g",
         "confidence": 0.91, "qty": 1, "unit_price": 3.25, "total": 3.25 }
     ],
     "subtotal": 45.80,
     "gst": 3.21,
     "total": 49.01
   }
```

### 4.3 Open Questions
See `threads/11-architecture.json` → thread A6.

- Category pre-filter strategy for RapidFuzz (required before fuzzy match)
- Handling multi-language receipts (English + Chinese characters on same receipt)

---

## 5. Data Architecture

### 5.1 Personal Bills Database (private, PDPA-governed)

```sql
users          (id, email_hash, created_at)
bills          (id, user_id, retailer_id, total, gst, scanned_at, confirmed_at)
bill_items     (id, bill_id, raw_text, matched_name, qty, unit, unit_price, total, confidence)
retailers      (id, name, chain, outlet_name, postal_code)
```

### 5.2 Comparison Pool Database (anonymised, no user linkage)

```sql
retail_chains  (id, name)                         -- e.g. "NTUC FairPrice"
items          (id, canonical_name, category, unit)
prices         (id, item_id, chain_id, price, currency, observed_month, source)
-- source: 'user_scan' | 'manual_seed'
-- NO user_id, NO bill_id, NO timestamp below month granularity
```

### 5.3 Data Flow: confirmed scan → comparison pool
```
bill_items.confidence > threshold AND user confirms
  → extract: canonical_name, chain, unit_price, month/year
  → INSERT into comparison_pool.prices
  → NO reference to user, bill, or full date
```

---

## 6. Cloud Infrastructure

### 6.1 Decided
| Concern | Decision |
|---|---|
| Region | AWS ap-southeast-1 (Singapore) OR Azure Southeast Asia |
| Temp image storage | S3 bucket or Azure Blob with 2-hr lifecycle/TTL policy |
| Image on success | Immediately deleted by .NET backend via SDK call |
| Image on crash | TTL policy auto-deletes after 2 hours |

### 6.2 Open Questions
See `threads/11-architecture.json` → thread A7.

- AWS vs Azure: final provider decision
- Comparison DB hosting (RDS PostgreSQL vs Aurora Serverless vs Azure Database)
- Container orchestration (ECS Fargate vs Azure Container Apps vs K8s)

---

## 7. Security & Privacy

| Concern | Approach |
|---|---|
| PDPA compliance | Personal bills DB under consent framework; comparison pool is outside scope (anonymised) |
| Image data | Never persists beyond session; no images in comparison pool |
| Auth tokens | JWT with short expiry + refresh token rotation |
| Transport | HTTPS everywhere; internal services over private VPC |
| Comparison framing | Never "expensive" — always "available for less at X" |

---

## 8. MVP Scope Boundary

**In MVP:**
- Singapore only
- Grocery receipts only (phase 1)
- Chain-level price comparison (not outlet-level)
- Android dev build first, iOS later
- Manual cold-start seed: top 50 staples at NTUC, Sheng Siong, Cold Storage, Giant, Don Don Donki + Indian provision shops

**Out of MVP:**
- Outlet-level comparison
- Budget tracking / alerts
- Category auto-tagging
- Export / reporting
- Multi-currency
