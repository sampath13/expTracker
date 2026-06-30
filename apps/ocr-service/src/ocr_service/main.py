from contextlib import asynccontextmanager

from fastapi import FastAPI

from ocr_service.api.router import api_router
from ocr_service.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.models_loaded = False
    app.state.models_loaded = True
    yield
    app.state.models_loaded = False


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
