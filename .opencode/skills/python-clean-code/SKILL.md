---
name: python-clean-code
description: Use when writing Python code in the OCR service (apps/ocr-service/) or seed scripts (scripts/seed/). Enforces PEP 8, type hints, FastAPI patterns, Pydantic models, OpenCV/PaddleOCR conventions, error handling, testing with pytest, and src-layout conventions. Use for all Python code in this repo.
---

# Python Clean Code — expTracker

Applies to: `apps/ocr-service/` (FastAPI OCR microservice) and `scripts/seed/` (seed data loader).

## Project Layout (src-layout)

```
apps/ocr-service/
├── src/
│   └── ocr_service/        # Installable package (pip install -e .)
│       ├── __init__.py
│       ├── main.py         # FastAPI app factory
│       ├── config.py       # pydantic-settings BaseSettings
│       ├── api/            # Thin route handlers → delegate to services
│       ├── schemas/        # Pydantic request/response models
│       ├── services/       # All business logic (stateless)
│       └── core/           # Cross-cutting: exceptions, middleware
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── pyproject.toml
└── requirements.txt
```

## Style (PEP 8 + Extensions)

```python
# ✅ Type hints on ALL function signatures (PEP 484)
def match_product(
    item_name: str,
    candidates: list[Product],
    threshold: float = 0.6,
) -> tuple[Product | None, float]:
    """Match item name against known products using RapidFuzz.

    Args:
        item_name: Raw OCR-extracted product name.
        candidates: Known products in the detected category.
        threshold: Minimum score (0.0-1.0) for a valid match.

    Returns:
        Tuple of (matched product or None, confidence score 0.0-1.0).
    """
    ...

# ✅ Use f-strings (Python 3.12+)
logger.info(f"Matched '{item_name}' → '{product.canonical_name}' ({confidence:.0%})")

# ❌ Avoid: bare except
# except:  ← catches KeyboardInterrupt, SystemExit — use except Exception

# ❌ Avoid: mutable default arguments
# def foo(items: list = []):  ← shared across calls
# def foo(items: list | None = None):  ← correct

# ✅ Use pathlib for file paths
from pathlib import Path
data_dir = Path(__file__).parent.parent / "data"
categories = json.loads((data_dir / "categories.json").read_text())

# ❌ Avoid: os.path string manipulation
# path = os.path.join(os.path.dirname(__file__), '..', 'data')  ← use pathlib
```

## Imports Order

```python
# 1. Standard library
from __future__ import annotations
import logging
from pathlib import Path

# 2. Third-party
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 3. Local application
from ocr_service.config import settings
from ocr_service.schemas.scan import ScanResponse
from ocr_service.services.ocr.engine import OcrEngine
```

## FastAPI Patterns

```python
# ✅ Thin router — just parsing, delegation, error handling
router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_receipt(file: UploadFile = File(...)) -> ScanResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        engine = OcrEngine()
        result = await asyncio.to_thread(engine.process, file.file)
        return result
    except ImageProcessingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("OCR scan failed")
        raise HTTPException(status_code=500, detail="Internal processing error")

# ✅ Pydantic models for all I/O
class ScanResponse(BaseModel):
    retailer: RetailerInfo
    date: date | None = None
    items: list[ScannedItem]
    subtotal: Decimal | None = None
    gst: Decimal | None = None
    total: Decimal | None = None

# ✅ Config via pydantic-settings
class Settings(BaseSettings):
    debug: bool = False
    ocr_timeout_seconds: int = 10
    paddleocr_lang: list[str] = ["en", "ch"]

    model_config = SettingsConfigDict(env_prefix="OCR_")
```

## Error Handling

```python
# ✅ Custom exception hierarchy
class OcrServiceError(Exception):
    """Base for all OCR service exceptions."""

class ImageProcessingError(OcrServiceError):
    """Preprocessing pipeline failed."""

class ParsingError(OcrServiceError):
    """Receipt field extraction failed."""

class ModelNotLoadedError(OcrServiceError):
    """PaddleOCR model not ready."""

# ✅ Return partial results on partial failure
async def process_receipt(image: np.ndarray) -> ScanResponse:
    items: list[ScannedItem] = []
    errors: list[str] = []

    for block in text_blocks:
        try:
            item = parse_line_item(block)
            items.append(item)
        except ParsingError as e:
            errors.append(str(e))

    return ScanResponse(
        items=items,
        warnings=errors if errors else None,
    )

# ❌ Avoid: silent None returns without logging
# if not result: return None  ← log the failure reason
```

## OpenCV + PaddleOCR Conventions

```python
# ✅ Named pipeline steps with configurable parameters
def preprocess(image: np.ndarray) -> np.ndarray:
    """Apply preprocessing pipeline: deskew → CLAHE → denoise → binarize."""
    image = deskew(image, angle_threshold=settings.deskew_threshold)
    image = apply_clahe(image, clip_limit=settings.clahe_clip_limit)
    image = denoise_bilateral(image, d=9, sigma_color=75, sigma_space=75)
    image = binarize_otsu(image)
    return image

# ✅ Save debug intermediates when DEBUG mode is on
if settings.debug:
    cv2.imwrite(str(debug_dir / "01_deskewed.jpg"), image)

# ✅ Context manager for model lifecycle
class OcrEngine:
    _instance: OcrEngine | None = None

    @classmethod
    def get_instance(cls) -> OcrEngine:
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_models()
        return cls._instance
```

## Testing (pytest)

```python
# conftest.py — shared fixtures
@pytest.fixture
def sample_image() -> np.ndarray:
    path = Path(__file__).parent / "fixtures" / "sample_receipt.jpg"
    return cv2.imread(str(path))

@pytest.fixture
def mock_ocr_engine(mocker) -> MagicMock:
    return mocker.patch("ocr_service.services.ocr.engine.OcrEngine")

# test file — arrange → act → assert
def test_extract_date_dd_mm_yyyy():
    result = extract_date("Date: 15/10/2024")
    assert result == date(2024, 10, 15)

def test_extract_date_invalid_returns_none():
    result = extract_date("No date here")
    assert result is None

def test_scan_endpoint_returns_items(client, sample_image):
    response = client.post("/ocr/scan", files={"file": sample_image})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
```

## Avoid

| Don't | Do |
|---|---|
| `except:` (bare) | `except Exception:` or specific exception |
| Mutable default args | `None` default + `or []` in body |
| `os.path.*` | `pathlib.Path` |
| `%` formatting or `.format()` | f-strings (Python 3.12+) |
| `global` variables | Class with class-level state or config |
| `print()` for logging | `logging.getLogger(__name__)` |
| Untyped function signatures | PEP 484 type hints |
| `import *` | Explicit imports |
| Mixing tabs and spaces | 4 spaces (PEP 8) |
| Comments explaining what | Comments explain **why** (code shows what) |
| Long functions (>50 lines) | Extract into smaller, named functions |
| Catching and ignoring exceptions | At minimum log the error |
| `dict.get()` without default where required | Use `.get("key", default)` or explicit check |
