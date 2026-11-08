import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import { promisify } from "util";

const statAsync = promisify(fs.stat);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audioFile = await prisma.audioFile.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }

    // Authorization: owner or admin only
    if (audioFile.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const filePath = audioFile.storagePath;
    let stat;
    try {
      stat = await statAsync(filePath);
    } catch {
      return NextResponse.json({ error: "Audio file not found on storage." }, { status: 404 });
    }

    const docName = audioFile.job.document.originalName.replace(/\.[^/.]+$/, "");
    const safeDownloadName = `${docName.replace(/[^a-zA-Z0-9_\-]/g, "_")}.mp3`;

    const fileStream = fs.createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Length": stat.size.toString(),
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${safeDownloadName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to download audio file." }, { status: 500 });
  }
}

