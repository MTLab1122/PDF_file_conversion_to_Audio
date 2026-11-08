import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        conversionJobs: {
          select: {
            id: true,
            status: true,
            progressPercent: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const serialized = documents.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      fileSizeBytes: Number(d.fileSizeBytes),
      pageCount: d.pageCount,
      isScanned: d.isScanned,
      ocrApplied: d.ocrApplied,
      createdAt: d.createdAt.toISOString(),
      latestJob: d.conversionJobs[0] || null,
    }));

    return NextResponse.json({
      documents: serialized,
      total: serialized.length,
      pagination: {
        total: serialized.length,
        page: 1,
        limit: serialized.length,
      },
    });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

