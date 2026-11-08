import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { JobStatus } from "@pdf-to-audio/shared";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.conversionJob.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        currentStage: true,
        progressPercent: true,
        totalChunks: true,
        completedChunks: true,
        errorMessage: true,
        audioFile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const isComplete = job.status === JobStatus.COMPLETED;
    const isFailed = job.status === JobStatus.FAILED;
    const isCancelled = job.status === JobStatus.CANCELLED;

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      stage: job.currentStage,
      progressPercent: job.progressPercent,
      completedChunks: job.completedChunks,
      totalChunks: job.totalChunks,
      error: job.errorMessage,
      isComplete,
      isFailed,
      isCancelled,
      audioFileId: job.audioFile?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch progress." }, { status: 500 });
  }
}

