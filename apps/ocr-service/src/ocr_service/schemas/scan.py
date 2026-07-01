from pydantic import BaseModel


class RetailerInfo(BaseModel):
    chain: str | None = None
    outlet: str | None = None


class ScanItem(BaseModel):
    raw: str
    matched_name: str | None = None
    confidence: float = 0.0
    confidence_tier: str = "LOW"
    category: str | None = None
    qty: int = 1
    unit: str | None = None
    unit_price: float = 0.0
    total: float = 0.0


class TextBlock(BaseModel):
    text: str
    confidence: float
    bounding_box: tuple[float, float, float, float]


class OcrRawResult(BaseModel):
    text_blocks: list[TextBlock]
    processing_time_ms: float = 0.0


class ScanResponse(BaseModel):
    retailer: RetailerInfo | None
    date: str
    items: list[ScanItem]
    subtotal: float
    gst: float
    total: float
