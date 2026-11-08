# Troubleshooting & Operational FAQ

This guide resolves common configuration, pipeline, and deployment issues encountered during local development or production operations.

---

## 1. Audio Merging & FFmpeg Issues

### Issue: "FFmpeg concat demuxer error on Windows temp path"
- **Symptom**: FFmpeg logs `Cannot find file 'C:\Users\...'` or syntax errors parsing line 1 of concat list.
- **Cause**: Windows backslashes (`\`) inside an FFmpeg demuxer text file are interpreted as C-escape sequences.
- **Solution**: The AudioMerger automatically normalizes all file paths to forward slashes (`/`). If manually configuring paths, ensure they use forward slashes.

### Issue: "FFmpeg or FFprobe command not found on PATH"
- **Symptom**: `FileNotFoundError: [WinError 2] The system cannot find the file specified` when assembling MP3s.
- **Solution**:
  - **Windows**: Install via `winget install --id Gyan.FFmpeg --silent` or download from Gyan.dev and add the `bin` directory to your user `PATH`. Restart your terminal.
  - **Linux / Ubuntu**: `sudo apt-get update && sudo apt-get install -y ffmpeg`
  - **macOS**: `brew install ffmpeg`

---

## 2. Text Extraction & OCR

### Issue: "Scanned document produces empty text"
- **Symptom**: Conversion pipeline reports `OCR required but Tesseract OCR is not installed on host`.
- **Cause**: The PDF consists of images/scans and Tesseract executable is not present on the host system PATH.
- **Solution**:
  - Install Tesseract on your system:
    - **Windows**: `winget install UB-Mannheim.TesseractOCR` and add to PATH.
    - **Linux**: `sudo apt-get install -y tesseract-ocr tesseract-ocr-eng`
  - Or run the platform inside Docker (`docker compose up`), where Tesseract and language traineddata are pre-installed.

---

## 3. Text-to-Speech (TTS) Providers

### Issue: "Edge TTS connection timeout or connection reset"
- **Symptom**: Transient network drop during Microsoft Edge Neural TTS websocket communication.
- **Solution**: The Celery task includes exponential backoff with up to 3 automatic retries. For completely offline or air-gapped testing, set `TTS_PROVIDER=mock` in your `.env`.

### Issue: "Missing Azure credentials error"
- **Symptom**: `Azure TTS provider requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION`.
- **Cause**: You selected `TTS_PROVIDER=azure` without providing valid Azure Speech Service API keys.
- **Solution**: Set `TTS_PROVIDER=edge` (default, zero credentials needed) or supply your Azure keys in `.env`.

---

## 4. Database & Prisma Connection

### Issue: "Can't reach database server at localhost:5432"
- **Symptom**: Next.js build or API returns connection refused.
- **Solution**: Ensure your PostgreSQL service is running:
  - If using Docker: `docker compose up -d postgres`
  - If using local Postgres: `pg_isready -h localhost -p 5432`

---

## 5. Next.js & Node / pnpm Build

### Issue: "ERR_PNPM_IGNORED_BUILDS on @prisma/engines or esbuild"
- **Symptom**: pnpm 12+ warns that native package build scripts are ignored.
- **Solution**: Run `pnpm approve-builds --all` once at the monorepo root.
