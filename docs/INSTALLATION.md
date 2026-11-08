# Installation & Local Setup Guide

This guide details how to install, configure, and execute the complete PDF-to-Audio platform in a local development or production environment.

---

## 1. Prerequisites

Ensure the following tools are installed on your host machine:

| Requirement | Minimum Version | Verified Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` | `26.0+` | JavaScript / TypeScript runtime |
| **pnpm** | `>= 9.0.0` | `12.0+` | Fast, disk space-efficient package manager |
| **Python** | `>= 3.10` | `3.14.0` | Python runtime for processing & worker |
| **FFmpeg** | `>= 6.0` | `9.0.2` | With `ffprobe` on system PATH |
| **Tesseract OCR** | `>= 5.0` | `5.3+` | Optional locally (adaptive fallback if missing) |
| **PostgreSQL** | `>= 14.0` | `16.0` | Primary application relational database |
| **Redis** | `>= 6.2` | `7.0` | Message queue and job status broker |

---

## 2. Monorepo Setup

Clone the repository and install all Node.js workspace dependencies:

```bash
# Clone the repository
git clone https://github.com/organization/pdf-to-audio.git
cd pdf-to-audio

# Install monorepo dependencies across apps/web and packages/shared
pnpm install

# Approve native dependencies build scripts if prompted (pnpm 12+)
pnpm approve-builds --all

# Build shared package
pnpm --filter @pdf-to-audio/shared build
```

---

## 3. Environment Configuration

Copy the example environment templates:

```bash
cp .env.example .env
```

Ensure your `.env` contains:

```env
# Database & Broker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pdf_to_audio?schema=public"
REDIS_URL="redis://localhost:6379/0"

# NextAuth
NEXTAUTH_SECRET="antigravity-secure-development-secret-key-32chars"
NEXTAUTH_URL="http://localhost:3000"

# Internal Security
INTERNAL_SERVICE_SECRET="antigravity-internal-service-secret-key-48chars"
PROCESSOR_SERVICE_URL="http://localhost:8000"

# TTS Configuration
TTS_PROVIDER="edge"
EDGE_TTS_VOICE="en-US-ChristopherNeural"

# Azure TTS (Optional)
AZURE_SPEECH_KEY=""
AZURE_SPEECH_REGION=""

# Storage Paths
UPLOAD_DIR="./storage/uploads"
CHUNKS_DIR="./storage/chunks"
AUDIO_DIR="./storage/audio"
```

---

## 4. Python Processor Setup

Create an isolated virtual environment and install backend requirements:

```bash
cd services/processor

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
cd ../..
```

---

## 5. Database Schema Initialization

Generate the Prisma Client and push the relational schema to PostgreSQL:

```bash
# Generate Prisma Client
pnpm --filter web db:generate

# Push schema directly (development)
pnpm --filter web db:push

# (Optional) Seed initial administrator and test user accounts
pnpm --filter web db:seed
```

---

## 6. Running the Services

Start each service in a dedicated terminal window:

### Terminal 1: Next.js Frontend & API Gateway
```bash
pnpm dev:web
# Accessible at http://localhost:3000
```

### Terminal 2: FastAPI Document Processing Service
```bash
pnpm dev:processor
# Swagger UI available at http://localhost:8000/docs
```

### Terminal 3: Celery Background Worker
```bash
pnpm dev:worker
```

---

## 7. Running with Docker Compose

For a zero-configuration containerized deployment:

```bash
docker compose up --build -d
```

Services will start:
- Web App: `http://localhost:3000`
- FastAPI Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
