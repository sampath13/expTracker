from contextlib import asynccontextmanager

from fastapi import FastAPI

from ocr_service.api.router import api_router
from ocr_service.config import settings
from ocr_service.services.ocr.ocr_engine import OCREngine


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = OCREngine()
    engine.load_models()
    app.state.ocr_engine = engine
    app.state.models_loaded = engine.is_loaded
    yield


app = FastAPI(
    title="ExpTracker OCR Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/ocr")


@app.get("/health")
async def health():
    models_loaded = getattr(app.state, "models_loaded", False)
    return {
        "status": "healthy" if models_loaded else "starting",
        "models_loaded": models_loaded,
    }
