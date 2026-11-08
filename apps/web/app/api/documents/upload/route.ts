import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { PLAN_CONFIGS, SubscriptionTier } from "@pdf-to-audio/shared";

// Enforce storage directory outside public web root
const STORAGE_ROOT = path.resolve(process.env.STORAGE_ROOT || "./storage");
const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userId = session.user.id;
    const userTier = (session.user.subscriptionTier as SubscriptionTier) || SubscriptionTier.FREE;
    const planLimits = PLAN_CONFIGS[userTier] || PLAN_CONFIGS[SubscriptionTier.FREE];

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No document file uploaded." }, { status: 400 });
    }

    // 1. File Size Validation against User Plan
    const maxSizeBytes = planLimits.maxFileSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File size exceeds the allowed limit of ${planLimits.maxFileSizeMb} MB for your current ${planLimits.name} plan.`,
        },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is completely empty." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Magic Bytes and PDF Binary Signature Validation (Do not trust MIME or Extension)
    const header = buffer.subarray(0, 1024).toString("latin1");
    if (!header.includes("%PDF-")) {
      return NextResponse.json(
        { error: "Invalid file format: Document does not contain valid PDF header signature." },
        { status: 400 }
      );
    }

    // 3. Cryptographic SHA-256 Hash Calculation (Integrity & Deduplication)
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. Secure File Storage with Randomized UUID Name
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const randomId = crypto.randomUUID();
    const serverFilename = `${randomId}.pdf`;
    const storagePath = path.join(UPLOADS_DIR, serverFilename);

    // Write file to disk
    await fs.writeFile(storagePath, buffer);

    // 5. Deep Structural and Safety Validation via Processor Service
    const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
    const apiKey = process.env.INTERNAL_API_KEY || "antigravity-internal-secret-token";

    let pageCount: number | null = null;
    let isEncrypted = false;

    try {
      const validateRes = await fetch(`${processorUrl}/api/documents/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-API-Key": apiKey,
        },
        body: JSON.stringify({
          file_path: storagePath,
          max_size_mb: planLimits.maxFileSizeMb,
          max_pages: planLimits.maxPagesPerDoc,
        }),
      });

      if (!validateRes.ok) {
        const errData = await validateRes.json().catch(() => ({}));
        // Remove uploaded file on validation failure
        await fs.unlink(storagePath).catch(() => {});
        return NextResponse.json(
          { error: errData.detail || "PDF structural validation failed." },
          { status: validateRes.status }
        );
      }

      const valData = await validateRes.json();
      pageCount = valData.page_count;
      isEncrypted = valData.is_encrypted;
    } catch (procErr: any) {
      // If processor is temporarily offline, we still accept valid PDF header, but log warning
      console.warn("Processor service validation call deferred:", procErr.message);
    }

    // 6. Record Document Entity in PostgreSQL Database
    const originalCleanName = path.basename(file.name).replace(/[^a-zA-Z0-9._\- ]/g, "_");

    const documentRecord = await prisma.document.create({
      data: {
        userId,
        filename: serverFilename,
        originalName: originalCleanName,
        fileSizeBytes: BigInt(file.size),
        mimeType: "application/pdf",
        pageCount,
        sha256Hash,
        storagePath,
      },
    });

    // 7. Update User Storage Usage
    const now = new Date();
    await prisma.usageRecord.updateMany({
      where: {
        userId,
        periodEnd: { gte: now },
      },
      data: {
        storageBytes: {
          increment: BigInt(file.size),
        },
      },
    });

    return NextResponse.json(
      {
        message: "PDF uploaded and verified successfully.",
        document: {
          id: documentRecord.id,
          originalName: documentRecord.originalName,
          originalFilename: documentRecord.originalName,
          fileSize: Number(documentRecord.fileSizeBytes),
          fileSizeBytes: Number(documentRecord.fileSizeBytes),
          pageCount: documentRecord.pageCount,
          createdAt: documentRecord.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document upload." },
      { status: 500 }
    );
  }
}

