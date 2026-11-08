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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            conversionJobs: true,
          },
        },
      },
    });

    const serialized = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      subscriptionTier: u.subscriptionTier,
      createdAt: u.createdAt.toISOString(),
      documentsCount: u._count.documents,
      conversionsCount: u._count.conversionJobs,
    }));

    return NextResponse.json({ users: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

