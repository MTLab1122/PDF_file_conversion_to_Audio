import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        conversionJobs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: {
        id: document.id,
        originalName: document.originalName,
        originalFilename: document.originalName,
        fileSize: Number(document.fileSizeBytes),
        fileSizeBytes: Number(document.fileSizeBytes),
        pageCount: document.pageCount,
        isScanned: document.isScanned,
        ocrApplied: document.ocrApplied,
        createdAt: document.createdAt.toISOString(),
        conversionJobs: document.conversionJobs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch document." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete file from disk
    await fs.unlink(document.storagePath).catch(() => {});

    // Delete record from DB (cascades to jobs and audio files)
    await prisma.document.delete({
      where: { id: document.id },
    });

    return NextResponse.json({ message: "Document deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}

