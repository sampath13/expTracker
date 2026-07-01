import os
import tempfile
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from ocr_service.core.exceptions import ImageProcessingError, ModelNotLoadedError
from ocr_service.schemas.scan import OcrRawResult, TextBlock
from ocr_service.services.ocr.ocr_engine import OCREngine
from ocr_service.services.preprocessing.processor import PreprocessingPipeline

router = APIRouter()


@router.post("/scan", response_model=OcrRawResult)
async def scan_receipt(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    from ocr_service.main import app

    engine: OCREngine = getattr(app.state, "ocr_engine", None)
    if not engine or not engine.is_loaded:
        raise HTTPException(status_code=503, detail="OCR models not loaded")

    contents = await file.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    try:
        tmp.write(contents)
        tmp_path = tmp.name
    finally:
        tmp.close()

    try:
        pipeline = PreprocessingPipeline()
        preprocessed = pipeline.process(tmp_path)

        start = time.perf_counter()
        raw_results = engine.process(preprocessed)
        elapsed = (time.perf_counter() - start) * 1000

        text_blocks = [
            TextBlock(
                text=r["text"],
                confidence=r["confidence"],
                bounding_box=r["bounding_box"],
            )
            for r in raw_results
        ]

        return OcrRawResult(
            text_blocks=text_blocks,
            processing_time_ms=round(elapsed, 2),
        )
    except ImageProcessingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ModelNotLoadedError as e:
        raise HTTPException(status_code=503, detail=str(e))
    finally:
        os.unlink(tmp_path)


@router.get("/health")
async def health():
    from ocr_service.main import app

    models_loaded = getattr(app.state, "models_loaded", False)
    return {
        "status": "healthy" if models_loaded else "starting",
        "models_loaded": models_loaded,
    }
