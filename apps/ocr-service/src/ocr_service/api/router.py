from fastapi import APIRouter

from ocr_service.api.scan import router as scan_router

api_router = APIRouter()
api_router.include_router(scan_router)
