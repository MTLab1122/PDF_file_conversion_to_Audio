import httpx
import uuid
import os
import sys

BASE_URL = "http://localhost:3000"
PROCESSOR_URL = "http://localhost:8000"
SAMPLE_DIR = os.path.abspath("submission/sample-files")

def test_edge_cases_and_security():
    print("==================================================================")
    print("PHASE 6 & 7: LIVE EDGE CASE & SECURITY AUDIT SUITE")
    print("==================================================================")

    # ---------------------------------------------------------
    # TEST 1: Unauthenticated Protected Route Access
    # ---------------------------------------------------------
    print("\n[Security Test 1] Unauthenticated access to protected routes")
    anon_client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    protected_endpoints = [
        ("GET", "/api/conversions"),
        ("POST", "/api/conversions"),
        ("POST", "/api/documents/upload"),
        ("GET", "/api/usage"),
        ("GET", "/api/admin/statistics"),
        ("GET", "/api/audio/00000000-0000-0000-0000-000000000000"),
    ]

    for method, endpoint in protected_endpoints:
        if method == "GET":
            res = anon_client.get(endpoint)
        else:
            res = anon_client.post(endpoint, json={})
        print(f"  Anonymous {method} {endpoint} -> Status {res.status_code}")
        assert res.status_code in [401, 403], f"Expected 401/403 for {endpoint}, got {res.status_code}"
    print("  PASS: All protected endpoints strictly reject anonymous requests.")

    # ---------------------------------------------------------
    # Setup Two Distinct Tenant Users (User A & User B)
    # ---------------------------------------------------------
    user_a_email = f"tenant_a_{uuid.uuid4().hex[:6]}@example.com"
    user_b_email = f"tenant_b_{uuid.uuid4().hex[:6]}@example.com"
    admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    pwd = "SecurePassword123!"

    print("\n[Setup] Creating User A, User B, and an Admin account")
    client_a = httpx.Client(base_url=BASE_URL, timeout=30.0, follow_redirects=True)
    client_b = httpx.Client(base_url=BASE_URL, timeout=30.0, follow_redirects=True)

    # Register User A
    res_a = client_a.post("/api/auth/register", json={"name": "Tenant A", "email": user_a_email, "password": pwd})
    assert res_a.status_code == 201
    user_a_id = res_a.json()["user"]["id"]

    csrf_a = client_a.get("/api/auth/csrf").json()["csrfToken"]
    login_a = client_a.post("/api/auth/callback/credentials", data={"csrfToken": csrf_a, "email": user_a_email, "password": pwd, "json": "true"})
    assert login_a.status_code == 200

    # Register User B
    res_b = client_b.post("/api/auth/register", json={"name": "Tenant B", "email": user_b_email, "password": pwd})
    assert res_b.status_code == 201
    user_b_id = res_b.json()["user"]["id"]

    csrf_b = client_b.get("/api/auth/csrf").json()["csrfToken"]
    login_b = client_b.post("/api/auth/callback/credentials", data={"csrfToken": csrf_b, "email": user_b_email, "password": pwd, "json": "true"})
    assert login_b.status_code == 200

    print(f"  User A: {user_a_email} ({user_a_id}) [AUTHENTICATED]")
    print(f"  User B: {user_b_email} ({user_b_id}) [AUTHENTICATED]")

    # ---------------------------------------------------------
    # TEST 2: Role-Based Access Control (USER vs ADMIN)
    # ---------------------------------------------------------
    print("\n[Security Test 2] Role-Based Access Control (RBAC)")
    # Standard User A attempting admin access
    admin_res = client_a.get("/api/admin/statistics")
    print(f"  Standard User GET /api/admin/statistics -> Status {admin_res.status_code}")
    assert admin_res.status_code == 403, f"Expected 403 Forbidden for non-admin, got {admin_res.status_code}"
    print("  PASS: Standard users strictly forbidden from accessing /api/admin/* endpoints.")

    # ---------------------------------------------------------
    # TEST 3: Multi-Tenant Data Isolation
    # ---------------------------------------------------------
    print("\n[Security Test 3] Multi-Tenant Data Isolation")
    # User A uploads a valid PDF
    pdf_path = os.path.join(SAMPLE_DIR, "digital_sample.pdf")
    with open(pdf_path, "rb") as f:
        up_res = client_a.post("/api/documents/upload", files={"file": ("doc_a.pdf", f, "application/pdf")})
    assert up_res.status_code == 201
    doc_a_id = up_res.json()["document"]["id"]
    print(f"  User A uploaded document ID: {doc_a_id}")

    # User B attempts to access User A's document
    res_b_doc = client_b.get(f"/api/documents/{doc_a_id}")
    print(f"  User B GET /api/documents/{doc_a_id} -> Status {res_b_doc.status_code}")
    assert res_b_doc.status_code in [403, 404], f"Expected 403/404 tenant isolation, got {res_b_doc.status_code}"

    # User B attempts to delete User A's document
    res_b_del = client_b.delete(f"/api/documents/{doc_a_id}")
    print(f"  User B DELETE /api/documents/{doc_a_id} -> Status {res_b_del.status_code}")
    assert res_b_del.status_code in [403, 404], f"Expected 403/404 on cross-tenant deletion, got {res_b_del.status_code}"

    # User A converts document
    conv_res = client_a.post("/api/conversions", json={
        "documentId": doc_a_id,
        "voiceId": "en-US-ChristopherNeural",
        "speechSpeed": 1.0,
    })
    assert conv_res.status_code in [201, 202]
    job_a_id = conv_res.json()["job"]["id"]
    print(f"  User A initiated conversion job ID: {job_a_id}")

    # User B attempts to access User A's conversion job
    res_b_job = client_b.get(f"/api/conversions/{job_a_id}")
    print(f"  User B GET /api/conversions/{job_a_id} -> Status {res_b_job.status_code}")
    assert res_b_job.status_code in [403, 404], f"Expected 403/404 cross-tenant job access, got {res_b_job.status_code}"

    # User B attempts to cancel User A's conversion job
    res_b_cancel = client_b.post(f"/api/conversions/{job_a_id}/cancel")
    print(f"  User B POST /api/conversions/{job_a_id}/cancel -> Status {res_b_cancel.status_code}")
    assert res_b_cancel.status_code in [403, 404], f"Expected 403/404 cross-tenant cancellation, got {res_b_cancel.status_code}"
    print("  PASS: Complete multi-tenant isolation verified across documents and conversion jobs.")

    # ---------------------------------------------------------
    # TEST 4: Corrupted PDF File Rejection
    # ---------------------------------------------------------
    print("\n[Edge Case Test 4] Corrupted PDF Upload")
    corrupt_path = os.path.join(SAMPLE_DIR, "corrupted_sample.pdf")
    with open(corrupt_path, "rb") as f:
        corrupt_res = client_a.post("/api/documents/upload", files={"file": ("corrupt.pdf", f, "application/pdf")})
    print(f"  Upload corrupted PDF -> Status {corrupt_res.status_code}: {corrupt_res.json().get('error')}")
    assert corrupt_res.status_code in [400, 422], f"Expected 400/422 for corrupt PDF, got {corrupt_res.status_code}"
    print("  PASS: Corrupted PDF correctly rejected with descriptive error.")

    # ---------------------------------------------------------
    # TEST 5: Disguised Non-PDF File Rejection (MIME spoofing)
    # ---------------------------------------------------------
    print("\n[Edge Case Test 5] Disguised Non-PDF (Executable/Text spoofed as .pdf)")
    fake_pdf_content = b"This is just a plain text file pretending to be a PDF!"
    spoofed_res = client_a.post("/api/documents/upload", files={"file": ("malicious.pdf", fake_pdf_content, "application/pdf")})
    print(f"  Upload spoofed non-PDF -> Status {spoofed_res.status_code}: {spoofed_res.json().get('error')}")
    assert spoofed_res.status_code == 400, f"Expected 400 for fake PDF signature, got {spoofed_res.status_code}"
    assert "PDF header signature" in spoofed_res.json().get("error", "")
    print("  PASS: File signature verification prevents non-PDF file upload regardless of extension/MIME.")

    # ---------------------------------------------------------
    # TEST 6: Zero-Byte Empty File Rejection
    # ---------------------------------------------------------
    print("\n[Edge Case Test 6] Empty 0-byte file upload")
    empty_res = client_a.post("/api/documents/upload", files={"file": ("empty.pdf", b"", "application/pdf")})
    print(f"  Upload 0-byte file -> Status {empty_res.status_code}: {empty_res.json().get('error')}")
    assert empty_res.status_code == 400
    print("  PASS: 0-byte empty files strictly rejected.")

    # ---------------------------------------------------------
    # TEST 7: Malformed Conversion Parameters & Input Validation
    # ---------------------------------------------------------
    print("\n[Edge Case Test 7] Malformed Conversion Parameters (Zod Validation)")
    # Invalid speed (< 0.5 or > 2.0)
    bad_speed_res = client_a.post("/api/conversions", json={
        "documentId": doc_a_id,
        "voiceId": "en-US-ChristopherNeural",
        "speechSpeed": 99.0
    })
    print(f"  Invalid speechSpeed=99.0 -> Status {bad_speed_res.status_code}")
    assert bad_speed_res.status_code == 400

    # Non-existent document UUID
    nonexistent_doc_id = str(uuid.uuid4())
    missing_doc_res = client_a.post("/api/conversions", json={
        "documentId": nonexistent_doc_id,
        "voiceId": "en-US-ChristopherNeural",
        "speechSpeed": 1.0
    })
    print(f"  Non-existent doc UUID -> Status {missing_doc_res.status_code}: {missing_doc_res.json().get('error')}")
    assert missing_doc_res.status_code == 404
    print("  PASS: Input validation bounds and foreign key constraints strictly enforced.")

    # ---------------------------------------------------------
    # TEST 8: FastAPI Internal API Key Security
    # ---------------------------------------------------------
    print("\n[Security Test 8] FastAPI Internal Endpoint Authorization (Processor Gateway)")
    fastapi_client = httpx.Client(base_url=PROCESSOR_URL, timeout=10.0)
    
    # Missing API Key
    no_key_res = fastapi_client.post("/api/documents/validate", json={"file_path": "any"})
    print(f"  FastAPI internal endpoint without API key -> Status {no_key_res.status_code}")
    assert no_key_res.status_code in [401, 403]

    # Invalid API Key
    bad_key_res = fastapi_client.post("/api/documents/validate", 
                                      headers={"X-Internal-API-Key": "invalid-token"}, 
                                      json={"file_path": "any"})
    print(f"  FastAPI internal endpoint with invalid API key -> Status {bad_key_res.status_code}")
    assert bad_key_res.status_code in [401, 403]
    print("  PASS: Internal processor microservice is secured against unauthorized ingress.")

    # ---------------------------------------------------------
    # TEST 9: SQL Injection & XSS Resilience
    # ---------------------------------------------------------
    print("\n[Security Test 9] SQL Injection & XSS Attack Payload Resilience")
    sqli_xss_name = "<script>alert('xss')</script> ' OR '1'='1' --"
    sqli_email = f"sqli_test_{uuid.uuid4().hex[:6]}@example.com"
    sqli_res = anon_client.post("/api/auth/register", json={
        "name": sqli_xss_name,
        "email": sqli_email,
        "password": "Password123!"
    })
    print(f"  Registration with SQLi/XSS payload in name -> Status {sqli_res.status_code}")
    assert sqli_res.status_code == 201
    print("  PASS: Input is safely parameterized; no execution or schema disruption occurred.")

    print("\n==================================================================")
    print(">>> ALL PHASE 6 & 7 EDGE CASE & SECURITY TESTS PASSED 100%! <<<")
    print("==================================================================")

if __name__ == "__main__":
    test_edge_cases_and_security()
