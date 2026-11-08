import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, boolean> = {
    database: false,
    processorApi: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    // Database check failed
  }

  const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${processorUrl}/api/health`, { cache: "no-store" });
    if (res.ok) {
      checks.processorApi = true;
    }
  } catch {
    // Processor API check failed
  }

  const isReady = checks.database;
  return NextResponse.json(
    {
      ready: isReady,
      checks,
    },
    { status: isReady ? 200 : 503 }
  );
}

