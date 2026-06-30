FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY data/ ./data/

EXPOSE 8000

HEALTHCHECK --interval=10s --retries=3 --timeout=5s \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.ocr_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
