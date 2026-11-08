# User Guide & Operations Manual

Welcome to **AudioDoc**, the commercial-grade PDF-to-Audio conversion platform. This manual walks through every feature of the user workflow from account registration to MP3 download.

---

## 1. Creating Your Account & Signing In

1. Navigate to `http://localhost:3000` (or your production domain).
2. Click **Get Started Free** in the navigation header or hero section.
3. Enter your Full Name, Email Address, and a secure password (minimum 8 characters).
4. Upon clicking **Create Free Account**, your account is provisioned immediately with the **Free Starter Plan** (10 free conversions, up to 20 pages per document).
5. You are redirected to your personal **Dashboard**.

---

## 2. Converting a PDF Document (Step-by-Step)

Click **New Conversion** in the header or dashboard to open the 3-Step Wizard:

### Step 1: Upload Your PDF File
- Drag and drop your `.pdf` file into the designated upload area or click to browse.
- The platform automatically verifies the `%PDF-` header signature and checks file size against your plan limit.
- Once validated, the document title, file size, and total verified page count are displayed. Click **Next: Configure Voice**.

### Step 2: Configure Voice & Speech Options
- **Target Language**: Select your preferred language (English, Spanish, French, German, Portuguese, Japanese, Chinese, etc.).
- **Neural Speaker**: Choose from natural neural character voices (e.g., Christopher, Jenny, Guy, Aria). Premium voices are unlocked on PRO and BUSINESS plans.
- **Speech Speed**: Use the slider or quick presets (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `1.75x`) to set the narration pace.
- Click **Next: Review & Start**.

### Step 3: Review & Initiate Pipeline
- Confirm your document summary, page count, voice selection, and speed.
- Click **Start Conversion Pipeline**. You will be directed immediately to the Live Progress Monitor.

---

## 3. Monitoring Live Conversion Progress

The pipeline tracker visually indicates every stage of execution:

1. **QUEUED**: Job enqueued into the Redis task broker.
2. **VALIDATING**: Document structure, EOF markers, and security verified.
3. **EXTRACTING**: PyMuPDF parses reading blocks, columns, and headings.
4. **OCR**: If scanned pages are detected, Tesseract 300 DPI engine generates text.
5. **PREPROCESSING**: Whitespace normalized, hyphens repaired across linebreaks.
6. **CHUNKING**: Sentence and paragraph boundaries split into TTS segments.
7. **GENERATING_AUDIO**: Real-time counter tracks chunk-by-chunk neural synthesis.
8. **MERGING**: FFmpeg concatenates chunks, adds ID3 tags, and validates duration.
9. **COMPLETED**: Mastered MP3 is ready for streaming and download.

*Note: You can cancel an in-flight job at any time using the Cancel button.*

---

## 4. Audio Playback & MP3 Download

When conversion reaches `COMPLETED`:
- **Audio Player**:
  - Click **Play / Pause** to listen immediately in your browser.
  - Drag the progress bar to seek through the audio file (supported by HTTP 206 range requests).
  - Use `-10s` and `+10s` skip buttons to navigate.
  - Toggle volume and mute.
  - Cycle playback speed (`0.75x`, `1x`, `1.25x`, `1.5x`, `2x`).
- **Download MP3**: Click **Download MP3** to save the clean, mastered audio file directly to your local computer.

---

## 5. Managing Conversions & Account Settings

- **Conversion History** (`/history`):
  - Search documents by name or voice.
  - Filter by status (`COMPLETED`, `QUEUED`, `FAILED`).
  - Delete old records and audio files.
  - Retry failed jobs with one click without re-charging monthly quotas.
- **Subscription Upgrades** (`/pricing`):
  - Upgrade to **PRO** ($19/mo) for 150 conversions, 150 pages/doc, and OCR.
  - Upgrade to **BUSINESS** ($79/mo) for 1,000 conversions, 500 pages/doc, and 10 concurrent jobs.
- **Account Settings** (`/settings`):
  - Update default preferred voice and speech speed.
  - View monthly quota consumption meters.
  - Delete user account and all stored documents in the Danger Zone.
