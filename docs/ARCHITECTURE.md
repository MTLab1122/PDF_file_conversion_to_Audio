# Architecture Overview

## Commercial PDF-to-Audio Conversion SaaS Platform

The **AudioDoc** platform is an enterprise-ready, distributed SaaS solution engineered to convert complex digital and scanned PDF documents into studio-quality neural MP3 audiobooks.

```mermaid
flowchart TD
    User["Registered User / Client"] -->|HTTPS / Next.js UI| WebApp["Next.js 14 App Router (apps/web)"]
    WebApp -->|Prisma ORM| Postgres[("PostgreSQL Database")]
    WebApp -->|Task Dispatch HTTP / Key Auth| FastApi["FastAPI Gateway (services/processor)"]
    FastApi -->|Enqueue Job| Redis[("Redis Message Broker")]
    Redis -->|Consume Task| Worker["Celery Worker (services/processor)"]
    Worker -->|PyMuPDF & Tesseract| Extractor["Text Extraction & OCR"]
    Extractor -->|Unicode & Hyphenation| Cleaner["Text Normalizer"]
    Cleaner -->|Sentence-Aware| Chunker["Text Chunker"]
    Chunker -->|Neural Synthesis| TTS["TTS Provider (Edge/Azure)"]
    TTS -->|Raw Audio Chunks| StorageChunks["Local/S3 Chunk Storage"]
    StorageChunks -->|Sequential Stitching & Tagging| FFmpeg["FFmpeg Audio Assembler"]
    FFmpeg -->|Mastered MP3| StorageAudio["Private Audio Storage"]
    Worker -->|Update Status / Quotas| Postgres
    WebApp -->|HTTP 206 Streaming / Download| StorageAudio
```

---

## 1. System Components

### 1.1 Web Application (`apps/web`)
- **Framework**: Next.js 14 with App Router, React 18, TypeScript (strict mode).
- **Styling**: Tailwind CSS, Radix UI primitives, Lucide icons.
- **State & Forms**: React Hook Form with Zod validation schemas, TanStack Query.
- **Authentication**: NextAuth.js (Auth.js) credentials provider with bcrypt password hashing (12 rounds) and JWT sessions.
- **Database Access**: Prisma ORM with connection pooling, transactional updates, and UUID primary keys.

### 1.2 Processor Service (`services/processor`)
- **API Layer**: FastAPI asynchronous microservice with OpenAPI v3 schema and internal API key authentication (`X-Internal-Secret`).
- **Worker Execution**: Celery 5.7 distributed worker cluster backed by Redis.
- **Text Extraction**:
  - `PyMuPDF` (Fitz 2.1+) for structural page-by-page block extraction, multi-column reading order preservation, and font metadata analysis.
  - `Tesseract OCR` adaptive fallback rendering scanned pages at 300 DPI via `Pillow` and `pytesseract`.
- **Text Normalization**: Unicode NFKC normalization, hyphenation repair across soft/hard linebreaks, and header/footer artifact suppression.
- **Sentence-Aware Chunking**: Punctuation- and clause-bounded chunking respecting maximum character budgets without splitting words.
- **Audio Processing**:
  - Abstract `TTSProvider` interface supporting Edge Neural TTS, Azure Speech Service, and deterministic Mock TTS.
  - `FFmpeg 9.0+` sequential MP3 demuxing, bitrate normalization, ID3 tagging, and ffprobe validation.

### 1.3 Persistence & Infrastructure
- **PostgreSQL 16**: Relational storage for users, accounts, subscriptions, documents, conversion jobs, chunks, and audit logs.
- **Redis 7**: Distributed queue, job lock manager, and worker heartbeat coordination.
- **Private Object Storage**: Segmented directories (`storage/uploads`, `storage/chunks`, `storage/audio`) isolated from public web access.

---

## 2. End-to-End Pipeline Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Web as Next.js Web App
    participant DB as PostgreSQL
    participant Proc as FastAPI Processor
    participant Queue as Redis Queue
    participant Worker as Celery Worker
    participant Ext as PyMuPDF / Tesseract
    participant TTS as Edge/Azure Neural TTS
    participant FFmpeg as FFmpeg Assembler

    User->>Web: Upload PDF (Signature checked)
    Web->>DB: Enforce monthly quota & store document
    User->>Web: Select Voice & Speed, click Convert
    Web->>Proc: POST /api/conversions (Dispatch)
    Proc->>DB: Create ConversionJob (QUEUED)
    Proc->>Queue: Enqueue conversion_task
    Queue->>Worker: Dequeue conversion_task
    Worker->>DB: Update stage = VALIDATING
    Worker->>Ext: Validate PDF & extract text
    alt Scanned or image-rich page
        Worker->>DB: Update stage = OCR
        Worker->>Ext: Render 300 DPI pixmap & run Tesseract
    end
    Worker->>DB: Update stage = PREPROCESSING
    Worker->>DB: Update stage = CHUNKING
    Worker->>DB: Update stage = GENERATING_AUDIO
    loop For each text chunk
        Worker->>TTS: Synthesize neural speech (Backoff retries)
        Worker->>DB: Record AudioChunk completed & increment progress
    end
    Worker->>DB: Update stage = MERGING
    Worker->>FFmpeg: Concatenate chunks & write ID3 tags
    Worker->>Worker: Validate final MP3 duration & size
    Worker->>DB: Update status = COMPLETED & commit AudioFile
    Web-->>User: Live SSE/Polling progress updates (0% -> 100%)
    User->>Web: Stream or Download MP3
```

---

## 3. Security Boundary & Ownership Isolation
- **Authentication**: All Next.js and processor routes enforce session tokens.
- **Authorization**: Row-level tenant isolation ensures users can only access their own documents, jobs, and audio streams.
- **File Validation**: MIME types are ignored; binary magic bytes (`%PDF-`) and EOF markers are strictly verified.
- **Path Traversal Guard**: Filenames are cryptographically randomized using UUIDv4; paths outside resolved storage directories are rejected with 403 Forbidden.
- **Internal Service Protection**: FastAPI processing endpoints require a shared secret header (`X-Internal-Secret`) matching `INTERNAL_SERVICE_SECRET`.

