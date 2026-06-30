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

    model_config = {"env_prefix": "OCR_", "case_sensitive": False}


settings = Settings()
