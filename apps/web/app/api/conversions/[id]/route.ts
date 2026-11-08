import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
      include: {
        document: true,
        audioFile: true,
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: {
            id: true,
            chunkIndex: true,
            characterCount: true,
            status: true,
            retryCount: true,
            textPreview: true,
            errorMessage: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Conversion not found" }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        currentStage: job.currentStage,
        progressPercent: job.progressPercent,
        voiceId: job.voiceId,
        voiceName: job.voiceId,
        language: job.language,
        speechSpeed: job.speechSpeed,
        speed: job.speechSpeed,
        totalChunks: job.totalChunks,
        completedChunks: job.completedChunks,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        document: {
          id: job.document.id,
          originalName: job.document.originalName,
          originalFilename: job.document.originalName,
          fileSize: Number(job.document.fileSizeBytes),
          fileSizeBytes: Number(job.document.fileSizeBytes),
          pageCount: job.document.pageCount,
        },
        audioFile: job.audioFile
          ? {
              id: job.audioFile.id,
              filename: job.audioFile.filename,
              durationSeconds: job.audioFile.durationSeconds,
              fileSizeBytes: Number(job.audioFile.fileSizeBytes),
              bitrateKbps: job.audioFile.bitrateKbps,
              downloadUrl: `/api/audio/${job.audioFile.id}/download`,
              streamUrl: `/api/audio/${job.audioFile.id}`,
            }
          : null,
        chunks: job.chunks,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch conversion details." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    });

    if (!job) {
      return NextResponse.json({ error: "Conversion not found" }, { status: 404 });
    }

    await prisma.conversionJob.delete({
      where: { id: job.id },
    });

    return NextResponse.json({ message: "Conversion deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete conversion." }, { status: 500 });
  }
}

