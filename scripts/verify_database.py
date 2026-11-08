import psycopg2
import uuid
import datetime

def test_database():
    conn = psycopg2.connect("postgresql://postgres:postgres@127.0.0.1:5432/pdf_to_audio")
    conn.autocommit = False
    cur = conn.cursor()

    print("--- 1. Verifying Database Tables ---")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"Found {len(tables)} tables: {', '.join(tables)}")
    assert "User" in tables or "users" in tables or "User" in [t for t in tables], "User table missing"

    print("\n--- 2. Verifying Table Records & Constraints ---")
    user_id = str(uuid.uuid4())
    test_email = f"audit_test_{uuid.uuid4().hex[:8]}@example.com"
    
    # Insert test user
    cur.execute("""
        INSERT INTO "User" (id, email, name, role, "subscriptionTier", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, 'USER', 'FREE', NOW(), NOW())
        RETURNING id, email;
    """, (user_id, test_email, "Audit User"))
    u_id, u_email = cur.fetchone()
    print(f"Created User: {u_email} ({u_id})")

    # Verify unique constraint on email
    try:
        cur.execute("""
            INSERT INTO "User" (id, email, name, role, "subscriptionTier", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, 'USER', 'FREE', NOW(), NOW());
        """, (str(uuid.uuid4()), test_email, "Duplicate User"))
        raise AssertionError("Duplicate email was allowed! Unique constraint failed.")
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        print("Unique constraint on email verified successfully (duplicate rejected)!")

    # Re-insert user after rollback
    conn.autocommit = False
    cur.execute("""
        INSERT INTO "User" (id, email, name, role, "subscriptionTier", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, 'USER', 'FREE', NOW(), NOW())
        RETURNING id;
    """, (user_id, test_email, "Audit User"))

    # Insert document
    doc_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO "Document" (id, "userId", filename, "originalName", "fileSizeBytes", "pageCount", "sha256Hash", "storagePath", "mimeType", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id;
    """, (doc_id, user_id, f"{doc_id}.pdf", "audit_test.pdf", 1024, 2, "hash123", "/path/test", "application/pdf"))
    print(f"Created Document record: {doc_id}")

    # Insert conversion job
    job_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO "ConversionJob" (id, "userId", "documentId", status, "progressPercent", "voiceId", language, "speechSpeed", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, 'QUEUED', 0.0, 'en-US-ChristopherNeural', 'en-US', 1.0, NOW(), NOW())
        RETURNING id;
    """, (job_id, user_id, doc_id))
    print(f"Created ConversionJob record: {job_id}")

    # Insert audio chunks
    for i in range(3):
        chunk_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO "AudioChunk" (id, "jobId", "chunkIndex", "textPreview", "characterCount", status, "retryCount", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, 'PENDING', 0, NOW(), NOW());
        """, (chunk_id, job_id, i, f"Test chunk content {i}", 20))
    print("Created 3 AudioChunk records successfully!")

    # Commit all
    conn.commit()

    # Verify foreign key cascade delete
    print("\n--- 3. Verifying Foreign Key Cascade Deletion ---")
    cur.execute('DELETE FROM "User" WHERE id = %s;', (user_id,))
    conn.commit()

    cur.execute('SELECT COUNT(*) FROM "Document" WHERE id = %s;', (doc_id,))
    assert cur.fetchone()[0] == 0, "Document was not cascade deleted!"

    cur.execute('SELECT COUNT(*) FROM "ConversionJob" WHERE id = %s;', (job_id,))
    assert cur.fetchone()[0] == 0, "ConversionJob was not cascade deleted!"

    cur.execute('SELECT COUNT(*) FROM "AudioChunk" WHERE "jobId" = %s;', (job_id,))
    assert cur.fetchone()[0] == 0, "AudioChunks were not cascade deleted!"

    print("Cascading deletion verified: Deleting User cleaned up Document, ConversionJob, and AudioChunks cleanly!")

    conn.close()
    print("\n>>> ALL PHASE 3 DATABASE VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_database()
