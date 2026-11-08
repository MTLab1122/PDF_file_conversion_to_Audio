import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, preferredVoice, preferredSpeed } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name ? { name } : {}),
      },
    });

    if (preferredVoice || preferredSpeed) {
      await prisma.voicePreference.upsert({
        where: {
          userId_language: {
            userId: session.user.id,
            language: "en-US",
          },
        },
        create: {
          userId: session.user.id,
          language: "en-US",
          voiceId: preferredVoice || "en-US-ChristopherNeural",
          speechSpeed: preferredSpeed || 1.0,
        },
        update: {
          ...(preferredVoice ? { voiceId: preferredVoice } : {}),
          ...(preferredSpeed ? { speechSpeed: preferredSpeed } : {}),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ACCOUNT_UPDATED",
        resource: "User",
        resourceId: session.user.id,
        metadata: JSON.stringify({ preferredVoice, preferredSpeed }),
      },
    });

    return NextResponse.json({ message: "Preferences saved successfully.", user: updatedUser });
  } catch (error: any) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Failed to update account preferences." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      // Clean up audio files, chunks, jobs, documents, subscriptions
      await tx.audioFile.deleteMany({ where: { userId } });
      await tx.conversionJob.deleteMany({ where: { userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.usageRecord.deleteMany({ where: { userId } });
      await tx.voicePreference.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ message: "Account permanently deleted." });
  } catch (error: any) {
    console.error("Account delete error:", error);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
