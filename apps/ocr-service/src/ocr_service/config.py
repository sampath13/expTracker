from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    debug: bool = False
    ocr_timeout_seconds: int = 10
    rapidfuzz_threshold_high: float = 0.85
    rapidfuzz_threshold_medium: float = 0.60
    paddleocr_lang: list[str] = ["en", "ch"]
    s3_service_url: str = "http://localhost:9444"
    s3_access_key: str = "AKIAIOSFODNN7EXAMPLE"
    s3_secret_key: str = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    s3_bucket_name: str = "exptracker-temp-images"

    ocr_confidence_threshold: float = 0.5
    ocr_use_angle_cls: bool = True
    ocr_det_db_thresh: float = 0.3
    ocr_det_db_box_thresh: float = 0.5
    ocr_rec_batch_num: int = 6

    preprocessing_debug: bool = False
    preprocessing_debug_dir: str = "/tmp/ocr-preprocessing"
    deskew_enabled: bool = True
    contrast_enhancement_enabled: bool = True
    denoise_enabled: bool = True
    binarisation_enabled: bool = True
    clahe_clip_limit: float = 2.0
    clahe_grid_size: int = 8
    bilateral_d: int = 9
    bilateral_sigma_color: float = 75.0
    bilateral_sigma_space: float = 75.0

    model_config = {"env_prefix": "OCR_", "case_sensitive": False}


settings = Settings()
