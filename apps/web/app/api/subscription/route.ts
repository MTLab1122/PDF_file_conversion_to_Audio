import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PLAN_CONFIGS, SubscriptionTier } from "@pdf-to-audio/shared";

const updatePlanSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const tier = (subscription?.tier as SubscriptionTier) || SubscriptionTier.FREE;
    const planLimits = PLAN_CONFIGS[tier];

    return NextResponse.json({
      subscription: {
        id: subscription?.id,
        tier,
        status: subscription?.status || "active",
        currentPeriodStart: subscription?.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription?.currentPeriodEnd.toISOString(),
        limits: planLimits,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch subscription." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updatePlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid tier provided." }, { status: 400 });
    }

    const newTier = result.data.tier;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: { subscriptionTier: newTier },
      });

      const sub = await tx.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          tier: newTier,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          tier: newTier,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SUBSCRIPTION_UPDATED",
          resource: "Subscription",
          resourceId: sub.id,
          metadata: `Plan changed to ${newTier}`,
        },
      });

      return { user, sub };
    });

    return NextResponse.json({
      message: `Successfully upgraded to ${PLAN_CONFIGS[newTier].name}!`,
      tier: newTier,
    });
  } catch (error: any) {
    console.error("Subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
  }
}

