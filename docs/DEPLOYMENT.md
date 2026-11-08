# Production Deployment Guide

This document describes how to deploy the **AudioDoc** platform using **Docker Compose** or on container platforms such as Kubernetes, AWS ECS, or DigitalOcean App Platform.

---

## 1. Container Architecture

The system consists of 5 container services:

| Service | Image / Build | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **`postgres`** | `postgres:16-alpine` | `5432` | Primary database |
| **`redis`** | `redis:7-alpine` | `6379` | Queue & broker |
| **`processor-api`** | `Dockerfile.processor` | `8000` | FastAPI document endpoints |
| **`celery-worker`** | `Dockerfile.worker` | - | PyMuPDF, OCR, TTS & FFmpeg worker |
| **`web`** | `Dockerfile.web` | `3000` | Next.js full-stack app |

---

## 2. Environment Variables

Create `.env` in the deployment directory based on `.env.example`:

```bash
# Production URLs
NEXTAUTH_URL="https://audiodoc.yourdomain.com"
NEXTAUTH_SECRET="replace-with-a-random-64-character-hex-string"

# Internal Security
INTERNAL_SERVICE_SECRET="replace-with-a-random-64-character-hex-string"
PROCESSOR_SERVICE_URL="http://processor-api:8000"

# Storage Mounts
UPLOAD_DIR="/app/storage/uploads"
CHUNKS_DIR="/app/storage/chunks"
AUDIO_DIR="/app/storage/audio"

# Database & Broker (Internal Docker DNS)
DATABASE_URL="postgresql://postgres:secure_db_password@postgres:5432/pdf_to_audio?schema=public"
REDIS_URL="redis://redis:6379/0"

# TTS Configuration
TTS_PROVIDER="edge"
EDGE_TTS_VOICE="en-US-ChristopherNeural"

# (Optional) Azure Speech
AZURE_SPEECH_KEY=""
AZURE_SPEECH_REGION=""
```

---

## 3. Deploying with Docker Compose

Run the deployment command:

```bash
# Build and start all 5 services in detached mode
docker compose up --build -d

# Verify all services are healthy
docker compose ps

# View unified application logs
docker compose logs -f
```

---

## 4. Reverse Proxy & SSL (Nginx Configuration)

Below is the recommended production Nginx configuration with SSL termination and WebSocket/SSE support:

```nginx
server {
    listen 80;
    server_name audiodoc.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name audiodoc.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/audiodoc.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/audiodoc.yourdomain.com/privkey.pem;

    client_max_body_size 100M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Audio range requests caching policy
    location ~* \.(mp3)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_cache_valid 200 206 1d;
    }
}
```

---

## 5. Health Checks & Monitoring

- **Next.js Web Liveness**: `GET https://audiodoc.yourdomain.com/api/health`
- **Next.js Database Readiness**: `GET https://audiodoc.yourdomain.com/api/health/ready`
- **Processor Liveness**: `GET http://localhost:8000/health`
- **Processor Readiness**: `GET http://localhost:8000/health/ready`
