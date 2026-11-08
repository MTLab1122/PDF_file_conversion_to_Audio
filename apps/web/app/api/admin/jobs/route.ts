import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@pdf-to-audio/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const jobs = await prisma.conversionJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true, name: true } },
        document: { select: { originalName: true, fileSizeBytes: true } },
        audioFile: { select: { id: true, durationSeconds: true } },
      },
    });

    const serialized = jobs.map((j) => ({
      id: j.id,
      userEmail: j.user.email,
      documentName: j.document.originalName,
      status: j.status,
      currentStage: j.currentStage,
      progressPercent: j.progressPercent,
      errorMessage: j.errorMessage,
      retryCount: j.retryCount,
      durationSeconds: j.audioFile?.durationSeconds || null,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
    }));

    return NextResponse.json({ jobs: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

