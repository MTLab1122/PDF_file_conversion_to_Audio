import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { JobStatus, UserRole } from "@pdf-to-audio/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
    }

    const [
      totalUsers,
      totalConversions,
      activeConversions,
      completedConversions,
      failedConversions,
      audioFilesAggregate,
      recentJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.conversionJob.count(),
      prisma.conversionJob.count({
        where: {
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
      }),
      prisma.conversionJob.count({ where: { status: JobStatus.COMPLETED } }),
      prisma.conversionJob.count({ where: { status: JobStatus.FAILED } }),
      prisma.audioFile.aggregate({
        _sum: {
          durationSeconds: true,
          fileSizeBytes: true,
        },
      }),
      prisma.conversionJob.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, name: true } },
          document: { select: { originalName: true } },
        },
      }),
    ]);

    const totalAudioSeconds = audioFilesAggregate._sum.durationSeconds || 0;
    const totalStorageBytes = audioFilesAggregate._sum.fileSizeBytes || BigInt(0);
    const storageUsageMb = Math.round(Number(totalStorageBytes) / (1024 * 1024));

    return NextResponse.json({
      statistics: {
        totalUsers,
        totalConversions,
        activeConversions,
        completedConversions,
        failedConversions,
        totalAudioSeconds,
        storageUsageMb,
        recentJobs: recentJobs.map((j) => ({
          id: j.id,
          userEmail: j.user.email,
          documentName: j.document.originalName,
          status: j.status,
          currentStage: j.currentStage,
          progressPercent: j.progressPercent,
          createdAt: j.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin statistics." }, { status: 500 });
  }
}

