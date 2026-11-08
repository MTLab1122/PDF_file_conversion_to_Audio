import httpx
import time
import subprocess
import os
import uuid
import sys

BASE_URL = "http://localhost:3000"
PDF_PATH = os.path.abspath("submission/sample-files/digital_sample.pdf")

def run_e2e_verification():
    print("==================================================")
    print("STARTING E2E CONVERSION WORKFLOW VERIFICATION")
    print(f"Target: {BASE_URL}")
    print(f"Sample PDF: {PDF_PATH}")
    print("==================================================")

    assert os.path.exists(PDF_PATH), f"PDF file not found at {PDF_PATH}"

    client = httpx.Client(base_url=BASE_URL, timeout=60.0, follow_redirects=True)

    # 1. Register test user
    test_email = f"e2e_user_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "SecurePassword123!"
    test_name = "E2E Test User"

    print(f"\n[Step 1] Registering user: {test_email}")
    reg_res = client.post("/api/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    })
    print(f"Register status: {reg_res.status_code}")
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    user_id = reg_res.json()["user"]["id"]
    print(f"User created: {user_id}")

    # 2. Authenticate via NextAuth
    print("\n[Step 2] Authenticating session via NextAuth")
    csrf_res = client.get("/api/auth/csrf")
    assert csrf_res.status_code == 200, "Failed to get CSRF token"
    csrf_token = csrf_res.json()["csrfToken"]

    login_res = client.post("/api/auth/callback/credentials", data={
        "csrfToken": csrf_token,
        "email": test_email,
        "password": test_password,
        "json": "true"
    })
    print(f"Login status: {login_res.status_code}")
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    print("Authenticated session established with cookie jar!")

    # 3. Check Initial Usage
    print("\n[Step 3] Checking initial usage quota")
    usage_res = client.get("/api/usage")
    assert usage_res.status_code == 200, f"Failed to get usage: {usage_res.text}"
    u_data = usage_res.json().get("usage", {})
    conversions_used = u_data.get("conversionsThisMonth", 0)
    conversions_limit = u_data.get("maxConversionsPerMonth", 10)
    print(f"Usage: {conversions_used} / {conversions_limit} conversions used")

    # 4. Upload PDF document
    print(f"\n[Step 4] Uploading PDF document: {os.path.basename(PDF_PATH)}")
    with open(PDF_PATH, "rb") as f:
        upload_res = client.post("/api/documents/upload", files={
            "file": (os.path.basename(PDF_PATH), f, "application/pdf")
        })
    print(f"Upload status: {upload_res.status_code}")
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    doc = upload_res.json()["document"]
    doc_id = doc["id"]
    file_size = doc.get("fileSizeBytes") or doc.get("fileSize", 0)
    print(f"Document uploaded: ID={doc_id}, Pages={doc['pageCount']}, Size={file_size} bytes")

    # 5. Create Conversion Job
    print("\n[Step 5] Initiating Conversion Job (Voice: en-US-ChristopherNeural, Speed: 1.0)")
    conv_res = client.post("/api/conversions", json={
        "documentId": doc_id,
        "voiceId": "en-US-ChristopherNeural",
        "language": "en-US",
        "speechSpeed": 1.0,
    })
    print(f"Conversion init status: {conv_res.status_code}")
    assert conv_res.status_code in [201, 202], f"Conversion init failed: {conv_res.text}"
    job = conv_res.json()["job"]
    job_id = job["id"]
    print(f"Conversion Job Enqueued: ID={job_id}, Initial Status={job['status']}")

    # 6. Poll Live Conversion Progress until Completion
    print("\n[Step 6] Monitoring real-time Celery pipeline progress...")
    max_wait = 180 # 3 minutes max
    start_time = time.time()
    completed_job = None

    while time.time() - start_time < max_wait:
        prog_res = client.get(f"/api/conversions/{job_id}/progress")
        if prog_res.status_code == 200:
            p_data = prog_res.json()
            status = p_data.get("status")
            pct = p_data.get("progressPercent", 0)
            msg = p_data.get("stage", "")
            chunks = f"{p_data.get('completedChunks', 0)}/{p_data.get('totalChunks', 0)}" if p_data.get('totalChunks') else ""
            print(f"  [{int(time.time() - start_time)}s] Status: {status} ({pct}%) | Stage: {msg} | Chunks: {chunks}")

            if status == "COMPLETED":
                completed_job = p_data
                break
            elif status == "FAILED":
                err = p_data.get("error") or p_data.get("errorMessage")
                raise AssertionError(f"Job failed in pipeline: {err}")
            elif status == "CANCELLED":
                raise AssertionError("Job was unexpectedly cancelled")
        time.sleep(2)

    assert completed_job is not None, "Job timed out before reaching COMPLETED status!"
    
    # Query GET /api/conversions/{job_id} to retrieve full job and audioFile metadata
    job_detail_res = client.get(f"/api/conversions/{job_id}")
    assert job_detail_res.status_code == 200, f"Failed to get conversion detail: {job_detail_res.text}"
    job_data = job_detail_res.json()["job"]
    audio_file = job_data.get("audioFile")
    assert audio_file is not None, "Completed job missing audioFile object!"
    audio_id = audio_file["id"]
    duration = audio_file.get("durationSeconds", 0)
    size_bytes = audio_file.get("fileSizeBytes", 0)
    bitrate = audio_file.get("bitrateKbps", 0)
    print(f"\n>>> CONVERSION COMPLETED SUCCESSFULLY! <<<")
    print(f"AudioFile ID: {audio_id}")
    print(f"Duration: {duration} seconds")
    print(f"File Size: {size_bytes} bytes")
    print(f"Bitrate: {bitrate} kbps")

    # 7. Test Audio Range Seeking (HTTP 206 Partial Content)
    print("\n[Step 7] Testing audio stream with Range header (HTTP 206 Seeking)")
    range_res = client.get(f"/api/audio/{audio_id}", headers={"Range": "bytes=0-1024"})
    print(f"Audio Range Status: {range_res.status_code}")
    assert range_res.status_code == 206, f"Expected 206 Partial Content, got {range_res.status_code}"
    print(f"Content-Range: {range_res.headers.get('content-range')}")
    print(f"Content-Type: {range_res.headers.get('content-type')}")

    # 8. Test Audio Download & FFprobe Validation
    print("\n[Step 8] Downloading MP3 audio file and running ffprobe validation")
    dl_res = client.get(f"/api/audio/{audio_id}/download")
    assert dl_res.status_code == 200, f"Download failed: {dl_res.status_code}"
    
    out_mp3_path = os.path.abspath("submission/sample-files/output_e2e_test.mp3")
    with open(out_mp3_path, "wb") as f:
        f.write(dl_res.content)
    print(f"Downloaded MP3 written to: {out_mp3_path} ({len(dl_res.content)} bytes)")

    # Run ffprobe on the downloaded MP3
    ffprobe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size,bit_rate:stream=codec_name,sample_rate,channels",
        "-of", "default=noprint_wrappers=1:nokey=1",
        out_mp3_path
    ]
    probe_output = subprocess.check_output(ffprobe_cmd, text=True).strip().splitlines()
    print("FFprobe Validation Output:")
    for line in probe_output:
        print(f"  {line}")

    # 9. Verify Conversion History
    print("\n[Step 9] Verifying user conversion history")
    history_res = client.get("/api/conversions")
    assert history_res.status_code == 200, "Failed to fetch history"
    history_jobs = history_res.json().get("conversions", [])
    assert any(j["id"] == job_id for j in history_jobs), "Job not found in user history!"
    print(f"Verified job {job_id} present in user conversion history table ({len(history_jobs)} total jobs found).")

    # 10. Verify Usage Increment
    print("\n[Step 10] Verifying usage accounting increment")
    new_usage_res = client.get("/api/usage")
    assert new_usage_res.status_code == 200
    new_u_data = new_usage_res.json().get("usage", {})
    new_conversions_used = new_u_data.get("conversionsThisMonth", 0)
    print(f"New Usage: {new_conversions_used} / {conversions_limit} conversions used")
    assert new_conversions_used == conversions_used + 1, "Usage counter did not increment!"
    print("Usage accounting correctly incremented by exactly 1 conversion!")

    print("\n==================================================")
    print(">>> ALL 10 E2E STEPS VERIFIED 100% SUCCESSFULLY! <<<")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
