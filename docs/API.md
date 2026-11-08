# API Specification & Reference

The **AudioDoc** platform exposes two distinct API surfaces:
1. **Frontend-Facing Application APIs** (`apps/web/app/api`) - Powered by Next.js App Router for authenticated client operations.
2. **Document Processing APIs** (`services/processor/app/api`) - Powered by FastAPI for internal microservice orchestration and Celery job dispatch.

---

## 1. Authentication & Session APIs

### `POST /api/auth/register`
Creates a new user account with default FREE plan quota.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "User created successfully",
    "user": {
      "id": "c1f729e2-...",
      "email": "jane@example.com",
      "name": "Jane Doe",
      "role": "USER",
      "subscriptionTier": "FREE"
    }
  }
  ```

### `POST /api/auth/[...nextauth]`
NextAuth session endpoints (Credentials authentication, session status, CSRF tokens, sign out).

---

## 2. Document Management APIs

### `POST /api/documents/upload`
Uploads and validates a PDF document.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: PDF binary stream
- **Validation**:
  - Checks binary signature (`%PDF-`)
  - Enforces tier size limit (15MB Free / 50MB Pro / 100MB Business)
  - Enforces page count limit via PyMuPDF (20 Free / 150 Pro / 500 Business)
- **Response `201 Created`**:
  ```json
  {
    "message": "Document uploaded successfully",
    "document": {
      "id": "e81e9f1a-...",
      "originalFilename": "quantum_physics.pdf",
      "fileSize": 1420580,
      "pageCount": 18,
      "mimeType": "application/pdf"
    }
  }
  ```

### `GET /api/documents`
Lists documents owned by the authenticated user.
- **Query Params**: `page` (default 1), `limit` (default 20)
- **Response `200 OK`**:
  ```json
  {
    "documents": [...],
    "pagination": { "page": 1, "limit": 20, "total": 5 }
  }
  ```

### `DELETE /api/documents/[id]`
Cascades deletion of document and associated files.

---

## 3. Conversion Pipeline APIs

### `POST /api/conversions`
Initiates a new background PDF-to-Audio conversion job.
- **Request Body**:
  ```json
  {
    "documentId": "e81e9f1a-...",
    "voiceId": "en-US-ChristopherNeural",
    "voiceName": "en-US-ChristopherNeural",
    "language": "en-US",
    "speed": 1.0,
    "audioFormat": "MP3"
  }
  ```
- **Response `202 Accepted`**:
  ```json
  {
    "message": "Conversion job initiated successfully",
    "job": {
      "id": "8f38c3de-...",
      "status": "QUEUED",
      "progressPercent": 0,
      "voiceName": "en-US-ChristopherNeural"
    }
  }
  ```

### `GET /api/conversions/[id]/progress`
Returns live progress telemetry for real-time UI tracking.
- **Response `200 OK`**:
  ```json
  {
    "id": "8f38c3de-...",
    "status": "GENERATING_AUDIO",
    "progressPercent": 65,
    "stageMessage": "Synthesizing neural audio chunk 5/8...",
    "totalChunks": 8,
    "processedChunks": 5,
    "audioFile": null
  }
  ```

### `POST /api/conversions/[id]/cancel`
Cancels an active conversion job.

### `POST /api/conversions/[id]/retry`
Retries an eligible failed conversion job without double-charging quotas.

---

## 4. Audio Streaming & Download APIs

### `GET /api/audio/[id]`
Streams high-fidelity MP3 audio supporting HTTP 206 Partial Content range requests for seekable playback.
- **Headers**:
  - `Range: bytes=0-1048576`
- **Response `206 Partial Content`**:
  - `Content-Range: bytes 0-1048576/4528190`
  - `Content-Type: audio/mpeg`

### `GET /api/audio/[id]/download`
Downloads the mastered MP3 with Content-Disposition attachment and sanitized filename.

---

## 5. Subscription & Usage APIs

### `GET /api/usage`
Retrieves monthly conversion usage, remaining quota, and concurrent job consumption.

### `PATCH /api/subscription`
Upgrades or downgrades subscription tier (`FREE`, `PRO`, `BUSINESS`).

---

## 6. Processor Service APIs (`services/processor`)

- **`GET /health`**: Liveness probe returning component statuses.
- **`GET /health/ready`**: Readiness probe checking Redis and PostgreSQL connectivity.
- **`GET /api/v1/voices`**: Discovers available Edge and Azure neural voices.
- **`POST /api/v1/documents/inspect`**: Inspects PDF structure, safety, and page count.
- **`POST /api/v1/conversions/start`**: Enqueues conversion tasks to the Celery Redis broker.
- **`GET /api/v1/conversions/{id}/status`**: Queries Celery job state and progress metadata.
- **`POST /api/v1/conversions/{id}/cancel`**: Terminates worker execution for an active job.

