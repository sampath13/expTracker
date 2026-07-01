import os

import cv2
import numpy as np

from ocr_service.config import settings
from ocr_service.core.exceptions import ImageProcessingError


class PreprocessingPipeline:
    def __init__(self) -> None:
        self._debug = settings.preprocessing_debug
        self._debug_dir = settings.preprocessing_debug_dir

    def process(self, image_path: str) -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise ImageProcessingError(f"Could not read image: {image_path}")

        if settings.deskew_enabled:
            image = self._deskew(image)
            self._maybe_save(image, "01_deskew")

        if settings.contrast_enhancement_enabled:
            image = self._apply_clahe(image)
            self._maybe_save(image, "02_clahe")

        if settings.denoise_enabled:
            image = self._denoise(image)
            self._maybe_save(image, "03_denoise")

        if settings.binarisation_enabled:
            image = self._binarize(image)
            self._maybe_save(image, "04_binarize")

        return image

    def _maybe_save(self, image: np.ndarray, name: str) -> None:
        if not self._debug:
            return
        os.makedirs(self._debug_dir, exist_ok=True)
        path = os.path.join(self._debug_dir, f"{name}.png")
        cv2.imwrite(path, image)

    @staticmethod
    def _deskew(image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 150)

        if lines is None:
            return image

        angles = [line[0][1] * 180 / np.pi - 90 for line in lines]

        if not angles:
            return image

        median_angle = np.median(angles)

        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        return cv2.warpAffine(
            image,
            rotation_matrix,
            (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )

    @staticmethod
    def _apply_clahe(image: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(
            clipLimit=settings.clahe_clip_limit,
            tileGridSize=(settings.clahe_grid_size, settings.clahe_grid_size),
        )
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    @staticmethod
    def _denoise(image: np.ndarray) -> np.ndarray:
        return cv2.bilateralFilter(
            image,
            d=settings.bilateral_d,
            sigmaColor=settings.bilateral_sigma_color,
            sigmaSpace=settings.bilateral_sigma_space,
        )

    @staticmethod
    def _binarize(image: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
