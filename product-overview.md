# ExpTracker — Product Overview

## What Is This?

ExpTracker is a mobile app for Singapore residents to scan grocery receipts, track personal spending, and instantly see whether the items they bought are available for less at a different supermarket chain.

It is not a generic expense tracker. It is not a budgeting app. It is specifically designed around one insight: **in Singapore, the same grocery item can differ by 20–40% in price across chains, and most people have no easy way to know this at the time they shop.**

---

## The Problem

### 1. Price opacity at the point of purchase
Singapore has no mandatory retail price registry and no MRP (Maximum Retail Price) law. Prices are set by each retailer independently and change without notice. NTUC FairPrice, Sheng Siong, Cold Storage, Giant, Don Don Donki, and Indian provision shops all stock many of the same items — at different prices. There is no single place to compare them.

### 2. Post-purchase regret with no actionable output
People occasionally notice a price difference after the fact — they see the same milk cheaper at a different store. But there is no lightweight way to record this observation, aggregate it with others, and turn it into a shopping habit.

### 3. Manual expense tracking is abandoned quickly
Existing expense trackers require manual data entry. People start, forget, and stop. The app must earn its keep at the moment of least friction: right after checkout, receipt in hand.

---

## The Solution

ExpTracker solves all three problems with a single flow:

```
Scan receipt  →  Review OCR output  →  Confirm  →  Expenses saved
                                                  ↓
                                     Anonymised price data contributed
                                     to shared comparison pool
                                                  ↓
                                     "This item is available for less
                                      at Sheng Siong"
```

1. **Scan** — point your phone camera at any grocery receipt. OCR (PaddleOCR) extracts every line item automatically.
2. **Confirm** — review the extracted items, correct any errors, then save. Your personal expense history is stored privately on the backend, linked only to your account.
3. **Compare** — the app checks the confirmed item prices against the crowdsourced comparison pool and surfaces price differences across chains. No judgemental framing — only "available for less at X."
4. **Contribute** — your confirmed prices (stripped of all personal identifiers) are added to the shared pool, making the comparison more accurate for everyone.

---

## Who Is This For?

**Primary user:** Singapore resident who does weekly or fortnightly grocery shopping, shops at 1–2 chains regularly, and wants to stretch their grocery budget without spending time on manual research.

**Not for:** Business expense tracking, travel expenses, non-grocery categories (phase 1), or users outside Singapore.

---

## Key Features (MVP)

| Feature | Description |
|---|---|
| Receipt scanning | Camera capture + OCR, English and Chinese receipts |
| OCR review screen | User confirms or edits extracted items before saving |
| Personal expense history | Privately stored bill and item history by date and retailer |
| Price comparison | Chain-level comparison for confirmed items against the shared pool |
| Crowdsourced pool | Anonymised price data contributed by all users, no personal linkage |
| Singapore-first | Covers NTUC FairPrice, Sheng Siong, Cold Storage, Giant, Don Don Donki, Indian provision shops |

---

## What Makes It Different

| Competitor | What they do | What they miss |
|---|---|---|
| Expensify / Shoeboxed | Receipt scanning for business expenses | No grocery focus, no price comparison |
| Mint / YNAB | Budget tracking | Manual entry, no OCR, no comparison |
| Smart Receipts | Personal receipt storage | No comparison, not Singapore-specific |
| PriceWatch-style sites | Manual price comparison | Not linked to your actual purchases |

**The gap:** No product combines post-purchase receipt scanning with crowdsourced, purchase-linked price comparison for Singapore grocery chains. That is the gap ExpTracker fills.

---

## Privacy Principles

- **Personal bills** are stored privately, linked to your account. You control them.
- **Comparison pool** contains only: item name, price, unit, retailer chain, month/year. No user ID, no bill ID, no full date. It is outside PDPA personal data scope by design.
- **Receipt images** are deleted immediately after OCR is confirmed. They are never stored permanently.
- **No selling of data.** The comparison pool is a shared utility, not a monetisation asset.

---

## Revenue Model

Freemium from launch:

| Tier | What you get |
|---|---|
| Free | Scan and save up to 10 bills/month, basic expense list, price comparison (limited queries) |
| Premium (paid) | Unlimited scans, full history, full comparison queries, spending trends, export |

Gating is set from day 1. There is no "free now, paid later" transition — that creates a feature regression perception problem.

---

## Tech Stack (Summary)

| Layer | Technology |
|---|---|
| Mobile | React Native (bare), react-native-vision-camera |
| Backend API | .NET 8, ASP.NET Core, PostgreSQL |
| OCR service | Python, FastAPI, OpenCV, PaddleOCR |
| Fuzzy matching | RapidFuzz (Python), three-tier confidence |
| Cloud storage | AWS S3 ap-southeast-1 (temp images only, 2-hr TTL) |
| Data residency | Singapore region (PDPA alignment) |

Full architecture detail: see `architecture.md`.

---

## Current Status

> Phase: **Pre-development — architecture and research complete.**

- Product scope, regulatory landscape (PDPA, CCCS), and competitive analysis: done
- System architecture design: done (see `architecture.md`)
- Open technical decisions (auth, cloud provider, state management): tracked in `threads/11-architecture.json`
- Implementation: not started
