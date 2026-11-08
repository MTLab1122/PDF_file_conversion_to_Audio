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

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      return NextResponse.json(
        { error: "Cannot cancel a job that has already finished." },
        { status: 400 }
      );
    }

    await prisma.conversionJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.CANCELLED,
        currentStage: "CANCELLED",
      },
    });

    // Notify processor API
    const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
    const apiKey = process.env.INTERNAL_API_KEY || "antigravity-internal-secret-token";
    fetch(`${processorUrl}/api/conversions/${job.id}/cancel`, {
      method: "POST",
      headers: { "X-Internal-API-Key": apiKey },
    }).catch(() => {});

    return NextResponse.json({ message: "Job cancelled successfully.", status: "CANCELLED" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to cancel job." }, { status: 500 });
  }
}

