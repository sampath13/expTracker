---
name: docker-dev
description: Use when working with Docker Compose, S3Ninja, local development environment setup, container configuration, or adding services to docker/docker-compose.yml. Use when debugging dev environment issues or when the user asks about running the app locally. Use ONLY for expTracker infrastructure work.
---

# Docker Dev Environment — expTracker

## Zero AWS Dependency Philosophy

Development runs entirely locally. No AWS account, credentials, or network access required. The only prod/dev difference is the S3 endpoint URL and connection strings — everything else is identical.

## Docker Compose Services

Location: `docker/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: exptracker
      POSTGRES_PASSWORD: exptracker_dev
      POSTGRES_MULTIPLE_DATABASES: personal_bills_db, comparison_pool_db
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U exptracker"]
      interval: 5s

  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile
    ports: ["5000:5000"]
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__PersonalBills=Host=postgres;Database=personal_bills_db;Username=exptracker;Password=exptracker_dev
      - ConnectionStrings__ComparisonPool=Host=postgres;Database=comparison_pool_db;Username=exptracker;Password=exptracker_dev
      - S3__ServiceURL=http://s3ninja:9444
      - S3__AccessKey=AKIAIOSFODNN7EXAMPLE
      - S3__SecretKey=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
      - S3__BucketName=exptracker-temp-images
      - OcrService__BaseUrl=http://ocr:8000
    depends_on:
      postgres:
        condition: service_healthy
      s3ninja:
        condition: service_started

  ocr:
    build:
      context: ../apps/ocr-service
      dockerfile: Dockerfile
    ports: ["8000:8000"]
    volumes:
      - paddleocr_cache:/root/.paddleocr  # Persist models across restarts
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/ocr/health"]
      interval: 10s
      retries: 3

  s3ninja:
    image: scireum/s3ninja:latest
    ports: ["9444:9444"]
    environment:
      - S3NINJA_BUCKET_NAME=exptracker-temp-images
    volumes:
      - s3data:/data

volumes:
  pgdata:
  s3data:
  paddleocr_cache:
```

## .env.example (root or docker/)

```
# PostgreSQL
POSTGRES_USER=exptracker
POSTGRES_PASSWORD=exptracker_dev
PERSONAL_BILLS_DB=personal_bills_db
COMPARISON_POOL_DB=comparison_pool_db

# API
ASPNETCORE_ENVIRONMENT=Development
JWT__KEY=<generate-32-char-random>
JWT__ISSUER=exptracker-api
JWT__AUDIENCE=exptracker-mobile
GOOGLE_CLIENT_ID_ANDROID=<placeholder>
GOOGLE_CLIENT_ID_IOS=<placeholder>

# S3 (S3Ninja in dev, AWS in prod)
S3__SERVICE_URL=http://localhost:9444
S3__ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3__SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3__BUCKET_NAME=exptracker-temp-images

# OCR Service
OCR_SERVICE_URL=http://localhost:8000
```

## Quick Start

```bash
# From repo root
docker compose -f docker/docker-compose.yml up -d

# Check all services healthy
docker compose -f docker/docker-compose.yml ps

# View logs
docker compose -f docker/docker-compose.yml logs -f api

# Stop
docker compose -f docker/docker-compose.yml down

# Full reset (clear DB + S3 data)
docker compose -f docker/docker-compose.yml down -v
```

## S3Ninja (Local S3 Emulator)

```
Endpoint:      http://localhost:9444
Bucket:        exptracker-temp-images
Access Key:    AKIAIOSFODNN7EXAMPLE (any value)
Secret Key:    wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (any value)
Web UI:        http://localhost:9444/ui
```

The .NET backend uses the **standard AWS SDK** pointed at the S3Ninja endpoint URL. When deploying to production, only the `S3__SERVICE_URL` and credentials change — no code changes.

In dev, the bucket's 2-hour TTL lifecycle policy is configured via S3Ninja's lifecycle configuration (or handled in test cleanup for short-lived dev sessions).

## Database Init Script

`docker/postgres/init.sql` — creates both databases on first start:

```sql
-- Create both databases if they don't exist
SELECT 'CREATE DATABASE personal_bills_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'personal_bills_db')\gexec

SELECT 'CREATE DATABASE comparison_pool_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'comparison_pool_db')\gexec
```

EF Core migrations are applied by the API on startup in Development mode.

## Health Check Order

1. PostgreSQL must be healthy before API starts
2. S3Ninja must be started (no health check endpoint)
3. OCR service health check verifies PaddleOCR models loaded
4. API starts last, applies migrations, ready to serve

## Dockerfiles

### API Dockerfile (`apps/api/Dockerfile`)
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENTRYPOINT ["dotnet", "api.dll"]
```

### OCR Dockerfile (`apps/ocr-service/Dockerfile`)
```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY data/ ./data/

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## File Locations

| Concern | Path |
|---|---|
| Docker Compose | `docker/docker-compose.yml` |
| PostgreSQL init | `docker/postgres/init.sql` |
| S3Ninja config | `docker/s3ninja/` |
| Env template | `docker/.env.example` |
| API Dockerfile | `apps/api/Dockerfile` |
| OCR Dockerfile | `apps/ocr-service/Dockerfile` |

## Conventions

- No AWS credentials in repo — use `.env.example` as template, real `.env` is gitignored
- All services on a single Docker network (compose default)
- Volume mounts for dev hot-reload where possible (API, OCR source code)
- S3Ninja for S3 emulation, never connect to real AWS in dev
- Health checks on all services for proper startup ordering
- Single `docker compose up` should start the entire dev environment
