import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  DEFAULT_VOICES,
  JobStatus,
  PLAN_CONFIGS,
  SubscriptionTier,
} from "@pdf-to-audio/shared";

const startConversionSchema = z
  .object({
    documentId: z.string().uuid("Invalid document ID"),
    voiceId: z.string().default("en-US-ChristopherNeural"),
    language: z.string().default("en-US"),
    speechSpeed: z.number().min(0.5).max(2.0).optional(),
    speed: z.number().min(0.5).max(2.0).optional(),
    idempotencyKey: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    speechSpeed: data.speechSpeed ?? data.speed ?? 1.0,
  }));

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const userId = session.user.id;
    const userTier = (session.user.subscriptionTier as SubscriptionTier) || SubscriptionTier.FREE;
    const planLimits = PLAN_CONFIGS[userTier] || PLAN_CONFIGS[SubscriptionTier.FREE];

    const body = await req.json();
    const result = startConversionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { documentId, voiceId, language, speechSpeed, idempotencyKey } = result.data;

    // 1. Ownership validation
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied." }, { status: 404 });
    }

    // 2. Check Idempotency Key (prevent duplicate billable jobs)
    if (idempotencyKey) {
      const existingJob = await prisma.conversionJob.findUnique({
        where: { idempotencyKey },
      });
      if (existingJob) {
        return NextResponse.json({
          job: existingJob,
          message: "Existing job matching idempotency key returned.",
        });
      }
    }

    // 3. Voice Tier Validation
    const selectedVoice = DEFAULT_VOICES.find((v) => v.id === voiceId);
    if (selectedVoice?.isPremium && !planLimits.premiumVoices) {
      return NextResponse.json(
        {
          error: "Selected voice is a Premium Voice available exclusively on Pro and Business plans.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // 4. Concurrency Limit Check
    const activeJobsCount = await prisma.conversionJob.count({
      where: {
        userId,
        status: {
          in: [
            JobStatus.QUEUED,
            JobStatus.VALIDATING,
            JobStatus.EXTRACTING,
            JobStatus.OCR,
            JobStatus.PREPROCESSING,
            JobStatus.CHUNKING,
            JobStatus.GENERATING_AUDIO,
            JobStatus.MERGING,
          ],
        },
      },
    });

    if (activeJobsCount >= planLimits.maxConcurrentJobs) {
      return NextResponse.json(
        {
          error: `Concurrent conversion limit reached (${activeJobsCount}/${planLimits.maxConcurrentJobs}). Please wait for current jobs to complete or upgrade your plan.`,
        },
        { status: 429 }
      );
    }

    // 5. Monthly Usage Limit Check
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usage = await prisma.usageRecord.findFirst({
      where: {
        userId,
        periodEnd: { gte: now },
      },
    });

    const monthlyConversions = usage ? usage.conversionsCount : 0;
    if (monthlyConversions >= planLimits.maxConversionsPerMonth) {
      return NextResponse.json(
        {
          error: `Monthly conversion limit reached (${monthlyConversions}/${planLimits.maxConversionsPerMonth}). Please upgrade your plan to continue.`,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // 6. Create Persistent ConversionJob in Database
    const job = await prisma.conversionJob.create({
      data: {
        userId,
        documentId,
        voiceId,
        language,
        speechSpeed,
        status: JobStatus.QUEUED,
        currentStage: "QUEUED",
        progressPercent: 0.0,
        idempotencyKey,
      },
    });

    // 7. Increment user's monthly conversions count
    if (usage) {
      await prisma.usageRecord.update({
        where: { id: usage.id },
        data: {
          conversionsCount: { increment: 1 },
          pagesProcessed: { increment: document.pageCount || 1 },
        },
      });
    }

    // 8. Dispatch Job to Python Processor API
    const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
    const apiKey = process.env.INTERNAL_API_KEY || "antigravity-internal-secret-token";

    try {
      const procRes = await fetch(`${processorUrl}/api/conversions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-API-Key": apiKey,
        },
        body: JSON.stringify({ job_id: job.id }),
      });

      if (!procRes.ok) {
        console.error("Processor API start returned error:", await procRes.text());
      }
    } catch (procErr: any) {
      console.warn("Could not dispatch to processor API directly:", procErr.message);
    }

    return NextResponse.json(
      {
        message: "Conversion job created and queued successfully.",
        job: {
          id: job.id,
          documentId: job.documentId,
          status: job.status,
          currentStage: job.currentStage,
          progressPercent: job.progressPercent,
          voiceId: job.voiceId,
          speechSpeed: job.speechSpeed,
          createdAt: job.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Start conversion error:", error);
    return NextResponse.json(
      { error: "Internal server error while initiating conversion." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const statusFilter = searchParams.get("status") || "ALL";

    const whereClause: any = {
      userId: session.user.id,
    };

    if (statusFilter !== "ALL") {
      whereClause.status = statusFilter as JobStatus;
    }

    if (query) {
      whereClause.document = {
        originalName: {
          contains: query,
          mode: "insensitive",
        },
      };
    }

    const jobs = await prisma.conversionJob.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            fileSizeBytes: true,
            pageCount: true,
          },
        },
        audioFile: {
          select: {
            id: true,
            filename: true,
            durationSeconds: true,
            fileSizeBytes: true,
            bitrateKbps: true,
          },
        },
      },
    });

    const serialized = jobs.map((j) => ({
      id: j.id,
      status: j.status,
      currentStage: j.currentStage,
      progressPercent: j.progressPercent,
      voiceId: j.voiceId,
      voiceName: j.voiceId,
      speechSpeed: j.speechSpeed,
      speed: j.speechSpeed,
      language: j.language,
      totalChunks: j.totalChunks,
      completedChunks: j.completedChunks,
      errorMessage: j.errorMessage,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      document: j.document
        ? {
            id: j.document.id,
            originalName: j.document.originalName,
            originalFilename: j.document.originalName,
            fileSize: Number(j.document.fileSizeBytes),
            fileSizeBytes: Number(j.document.fileSizeBytes),
            pageCount: j.document.pageCount,
          }
        : null,
      audioFile: j.audioFile
        ? {
            id: j.audioFile.id,
            filename: j.audioFile.filename,
            durationSeconds: j.audioFile.durationSeconds,
            fileSizeBytes: Number(j.audioFile.fileSizeBytes),
            bitrateKbps: j.audioFile.bitrateKbps,
            downloadUrl: `/api/audio/${j.audioFile.id}/download`,
            streamUrl: `/api/audio/${j.audioFile.id}`,
          }
        : null,
    }));

    return NextResponse.json({
      conversions: serialized,
      jobs: serialized,
      total: serialized.length,
      pagination: {
        total: serialized.length,
        page: 1,
        limit: serialized.length,
      },
    });
  } catch (error: any) {
    console.error("List conversions error:", error);
    return NextResponse.json({ error: "Failed to list conversions." }, { status: 500 });
  }
}

