import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_VOICES } from "@pdf-to-audio/shared";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");

  const processorUrl = process.env.PROCESSOR_API_URL || "http://localhost:8000";
  try {
    const url = language
      ? `${processorUrl}/api/voices?language=${encodeURIComponent(language)}`
      : `${processorUrl}/api/voices`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    // Fallback to shared default voices
  }

  let voices = DEFAULT_VOICES;
  if (language) {
    voices = voices.filter((v) => v.language.toLowerCase().startsWith(language.toLowerCase()));
  }

  return NextResponse.json({
    voices,
    count: voices.length,
  });
}

