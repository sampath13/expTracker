import logging
from typing import Any

import numpy as np

from ocr_service.config import settings
from ocr_service.core.exceptions import ModelNotLoadedError

logger = logging.getLogger(__name__)


class OCREngine:
    def __init__(self) -> None:
        self._ocr: Any = None
        self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def load_models(self) -> None:
        try:
            from paddleocr import PaddleOCR

            self._ocr = PaddleOCR(
                use_angle_cls=settings.ocr_use_angle_cls,
                lang="ch",
                det_db_thresh=settings.ocr_det_db_thresh,
                det_db_box_thresh=settings.ocr_det_db_box_thresh,
                rec_batch_num=settings.ocr_rec_batch_num,
            )
            self._loaded = True
            logger.info("PaddleOCR models loaded successfully (en + ch)")
        except ImportError:
            logger.warning("PaddleOCR not installed; OCR engine unavailable")
            self._loaded = False
        except Exception:
            logger.exception("Failed to load PaddleOCR models")
            self._loaded = False

    def process(self, image: np.ndarray) -> list[dict]:
        if not self._loaded or self._ocr is None:
            raise ModelNotLoadedError("OCR models not loaded")

        raw = self._ocr.ocr(image, cls=True)

        results: list[dict] = []
        if not raw or raw == [[]]:
            return results

        for page in raw:
            if page is None:
                continue
            for bbox, (text, conf) in page:
                if conf < settings.ocr_confidence_threshold:
                    continue
                x_coords = [pt[0] for pt in bbox]
                y_coords = [pt[1] for pt in bbox]
                results.append({
                    "text": text,
                    "confidence": round(conf, 4),
                    "bounding_box": (
                        min(x_coords),
                        min(y_coords),
                        max(x_coords),
                        max(y_coords),
                    ),
                })

        return results
