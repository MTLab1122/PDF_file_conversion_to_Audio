import { NextResponse } from "next/server";
import { SUPPORTED_LANGUAGES } from "@pdf-to-audio/shared";

export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

