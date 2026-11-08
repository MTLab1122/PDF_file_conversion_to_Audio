import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { JobStatus, PLAN_CONFIGS, SubscriptionTier } from "@pdf-to-audio/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userTier = (session.user.subscriptionTier as SubscriptionTier) || SubscriptionTier.FREE;
    const planLimits = PLAN_CONFIGS[userTier] || PLAN_CONFIGS[SubscriptionTier.FREE];

    const now = new Date();
    let usage = await prisma.usageRecord.findFirst({
      where: {
        userId,
        periodEnd: { gte: now },
      },
      orderBy: { periodStart: "desc" },
    });

    if (!usage) {
      // Create period if missing
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);
      usage = await prisma.usageRecord.create({
        data: {
          userId,
          periodStart: now,
          periodEnd,
          conversionsCount: 0,
          pagesProcessed: 0,
          charactersCount: 0,
          storageBytes: BigInt(0),
        },
      });
    }

    const activeJobsCount = await prisma.conversionJob.count({
      where: {
        userId,
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
    });

    return NextResponse.json({
      usage: {
        userId,
        tier: userTier,
        planName: planLimits.name,
        conversionsThisMonth: usage.conversionsCount,
        maxConversionsPerMonth: planLimits.maxConversionsPerMonth,
        pagesThisMonth: usage.pagesProcessed,
        maxPagesPerDoc: planLimits.maxPagesPerDoc,
        storageUsedBytes: Number(usage.storageBytes),
        maxFileSizeMb: planLimits.maxFileSizeMb,
        activeJobsCount,
        maxConcurrentJobs: planLimits.maxConcurrentJobs,
        premiumVoices: planLimits.premiumVoices,
        resetDate: usage.periodEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Usage summary error:", error);
    return NextResponse.json({ error: "Failed to fetch usage summary." }, { status: 500 });
  }
}

