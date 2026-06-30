---
name: python-ocr-service
description: Use when creating or modifying the Python OCR microservice in apps/ocr-service/, including FastAPI routes, OpenCV preprocessing, PaddleOCR integration, RapidFuzz product matching, receipt field parsing, category detection, or the processing pipeline. Use ONLY for the expTracker OCR service.
---

# Python OCR Service — expTracker

## Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Web framework | FastAPI | Async, scalable, independent deployment |
| Image preprocessing | OpenCV | Deskew, CLAHE, bilateral filter, Otsu binarisation |
| OCR engine | PaddleOCR | English + Chinese model, Apache 2.0 license |
| Fuzzy matching | RapidFuzz | token_set_ratio, three-tier confidence |
| Dependency management | pip + requirements.txt | Pin exact versions |

## Project Structure

Follows the **FastAPI domain-driven convention** with src-layout (PyPA recommended):

```
apps/ocr-service/
├── src/
│   └── ocr_service/
│       ├── __init__.py
│       ├── main.py               # FastAPI app instance, lifespan, include_routers
│       ├── config.py             # pydantic-settings BaseSettings
│       ├── api/
│       │   ├── __init__.py
│       │   ├── router.py         # Master APIRouter combining sub-routers
│       │   └── scan.py           # POST /ocr/scan
│       ├── schemas/              # Pydantic request/response models
│       │   ├── __init__.py
│       │   └── scan.py
│       ├── services/             # Business logic layer (stateless)
│       │   ├── __init__.py
│       │   ├── preprocessing/    # OpenCV pipeline
│       │   │   ├── __init__.py
│       │   │   ├── deskew.py
│       │   │   ├── contrast.py
│       │   │   ├── denoise.py
│       │   │   └── binarize.py
│       │   ├── ocr/              # PaddleOCR engine
│       │   │   ├── __init__.py
│       │   │   └── engine.py
│       │   ├── parsing/          # Receipt field extraction
│       │   │   ├── __init__.py
│       │   │   ├── retailer.py
│       │   │   ├── date.py
│       │   │   └── line_items.py
│       │   └── matching/         # Category filter + RapidFuzz
│       │       ├── __init__.py
│       │       ├── category_filter.py
│       │       └── matcher.py
│       └── core/                 # Cross-cutting concerns
│           ├── __init__.py
│           └── exceptions.py
├── data/
│   └── categories.json           # Category → keyword prefix map
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_date_parser.py
│   │   ├── test_category_filter.py
│   │   └── test_matcher.py
│   ├── integration/
│   │   ├── test_scan_endpoint.py
│   │   └── test_health_endpoint.py
│   └── fixtures/
│       ├── sample_receipt.jpg
│       └── blurry_receipt.jpg
├── pyproject.toml
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Processing Pipeline

```
1. Receive image (binary upload OR S3 URL)
   ↓
2. OpenCV Preprocessing
   a. Deskew — Hough line transform, rotate to correct alignment
   b. Contrast — CLAHE (Contrast Limited Adaptive Histogram Equalization)
   c. Denoise — Bilateral filter (preserves edges, removes noise)
   d. Binarise — Otsu's threshold (binary black/white)
   ↓
3. PaddleOCR — extract raw text blocks with bounding boxes + confidence
   ↓
4. Receipt Field Parsing
   a. Retailer name — largest font text block at receipt top
   b. Date — regex: DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY
   c. Total — bottom-of-receipt '$ / SGD' heuristic
   d. GST — line near total with 'GST' / 'Tax' keyword
   e. Line items — 'name qty unit_price total' pattern
   ↓
5. Category Detection — keyword prefix filter (see categories.json)
   ↓
6. RapidFuzz Matching — against known products in detected category
   ↓
7. Return structured JSON

Performance targets:
  - Process standard receipt in < 3 seconds
  - Match 10 items against 500-product pool in < 100ms
```

## Category Keyword Prefix Map

Located in `apps/ocr-service/data/categories.json`:

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

Tokenize item raw_name → match first meaningful token against prefixes (case-insensitive) → first match wins → fallback to "Uncategorised".

## Confidence Tiers

| Tier | Score | Action |
|---|---|---|
| HIGH | > 85% | Auto-match to canonical product, no user prompt |
| MEDIUM | 60–85% | Show "Is this [X]? Yes / No" — include top-3 candidates |
| LOW | < 60% | Treat as new/unmatched item, user manually categorises |

## API Endpoints

```
POST /ocr/scan
  Request:  { "image_url": "s3://bucket/key" }  OR  multipart binary upload
  Response: {
    "retailer": { "chain": "NTUC FairPrice", "outlet": "Clementi Mall, ..." },
    "date": "2024-10-15",
    "items": [{
      "raw": "SUNSHINE WHT BRD 600G",
      "matched_name": "Sunshine White Bread 600g",
      "confidence": 0.91,
      "confidence_tier": "HIGH",
      "category": "Bakery",
      "qty": 1,
      "unit": "600g",
      "unit_price": 3.25,
      "total": 3.25
    }],
    "subtotal": 45.80,
    "gst": 3.21,
    "total": 49.01
  }

POST /ocr/health
  Response: { "status": "healthy", "models_loaded": ["en", "ch"] }
```

## Error Handling

| Scenario | Response |
|---|---|
| OCR fails entirely | 422 with error message, suggest manual entry |
| Partial failure | 200 with partial items, `unparsed_fields` array |
| Corrupt/unsupported image | 400 with clear error |
| Timeout (>10s) | 200 with partial results (if any), or 408 |
| Model not loaded | 503, service restarting |
| S3 object not found | 404 |

## RapidFuzz Matching

```python
from rapidfuzz import process, fuzz

def match_product(item_name: str, candidates: list[Product], threshold: float = 0.6):
    names = [p.canonical_name for p in candidates]
    result = process.extractOne(
        item_name,
        names,
        scorer=fuzz.token_set_ratio,
        score_cutoff=int(threshold * 100)
    )
    if result:
        match, score, idx = result
        confidence = score / 100.0
        return candidates[idx], confidence
    return None, 0.0
```

### Scan Endpoint (`api/scan.py`)

```python
from fastapi import APIRouter, File, UploadFile, HTTPException
from ocr_service.schemas.scan import ScanResponse
from ocr_service.services.ocr.engine import OcrEngine

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_receipt(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    engine = OcrEngine()
    result = await engine.process(file)
    return result

@router.get("/health")
async def health():
    return {"status": "healthy", "models_loaded": ["en", "ch"]}
```

### Application Startup (`src/ocr_service/main.py`)

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from ocr_service.api.router import api_router
from ocr_service.config import settings
from ocr_service.services.ocr.engine import OcrEngine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: preload PaddleOCR models
    OcrEngine.load_models(["en", "ch"])
    yield
    # Shutdown: cleanup if needed

app = FastAPI(
    title="ExpTracker OCR Service",
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/ocr")
```

### Config (`src/ocr_service/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    debug: bool = False
    ocr_timeout_seconds: int = 10
    rapidfuzz_threshold_high: float = 0.85
    rapidfuzz_threshold_medium: float = 0.60
    paddleocr_lang: list[str] = ["en", "ch"]

    class Config:
        env_prefix = "OCR_"

settings = Settings()
```

## Model Storage

- PaddleOCR models auto-downloaded on first startup
- Cached in `~/.paddleocr/` by default
- In Docker: mount a volume to persist across container restarts
- Approximate model size: ~200MB for EN+CN

## Conventions

- **src-layout** — `src/ocr_service/` forces editable install, prevents import bugs
- `__init__.py` in every package/sub-package (even if empty)
- `api/` — thin route handlers only; delegate to `services/`
- `schemas/` — Pydantic models for request/response; never expose ORM or internal types
- `services/` — all business logic; stateless, independently testable
- `config.py` — pydantic-settings `BaseSettings`, env-prefixed (`OCR_`)
- Type hints on all function signatures (PEP 484)
- Structured logging to stdout (JSON in production)
- All preprocessing steps configurable via env vars
- DEBUG mode saves intermediate images to `data/debug/`
- Category keyword map loaded from `data/categories.json` on startup
- PaddleOCR models cached in `~/.paddleocr/`; Docker volume mount for persistence
- `pytest` for testing; `conftest.py` for shared fixtures at test root
- `tests/unit/` and `tests/integration/` separation
