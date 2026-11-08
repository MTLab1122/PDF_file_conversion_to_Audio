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

    const totalSize = stat.size;
    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      // Support HTTP 206 Partial Content for smooth seeking in audio player
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "audio/mpeg",
        },
      });
    }

    // Full audio stream
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
        "Content-Length": totalSize.toString(),
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error: any) {
    console.error("Audio stream error:", error);
    return NextResponse.json({ error: "Failed to stream audio file." }, { status: 500 });
  }
}

