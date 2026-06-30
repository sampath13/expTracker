from fastapi import APIRouter, File, HTTPException, UploadFile

from ocr_service.schemas.scan import ScanResponse

router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
async def scan_receipt(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    return ScanResponse(
        retailer=None,
        date="",
        items=[],
        subtotal=0.0,
        gst=0.0,
        total=0.0,
    )


@router.get("/health")
async def health():
    from ocr_service.main import app

    models_loaded = getattr(app.state, "models_loaded", False)
    return {
        "status": "healthy" if models_loaded else "starting",
        "models_loaded": models_loaded,
    }
