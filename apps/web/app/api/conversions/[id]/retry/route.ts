import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { JobStatus } from "@pdf-to-audio/shared";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.conversionJob.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== JobStatus.FAILED && job.status !== JobStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Only failed or cancelled jobs can be retried." },
        { status: 400 }
      );
    }

    // Reset status to QUEUED without recharging usage quotas
    const updated = await prisma.conversionJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.QUEUED,
        currentStage: "QUEUED",
        progressPercent: 0.0,
        errorMessage: null,
        retryCount: { increment: 1 },
      },
    });

    // Notify processor API
    const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
    const apiKey = process.env.INTERNAL_API_KEY || "antigravity-internal-secret-token";
    fetch(`${processorUrl}/api/conversions/${job.id}/retry`, {
      method: "POST",
      headers: { "X-Internal-API-Key": apiKey },
    }).catch(() => {});

    return NextResponse.json({
      message: "Job reset and re-queued for processing.",
      job: {
        id: updated.id,
        status: updated.status,
        retryCount: updated.retryCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to retry job." }, { status: 500 });
  }
}

