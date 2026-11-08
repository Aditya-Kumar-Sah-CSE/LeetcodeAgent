import { NextRequest, NextResponse } from "next/server";
import { fetchAvailableModels } from "@/lib/services/aiService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get("api_key");

  try {
    const models = await fetchAvailableModels(apiKey);
    return NextResponse.json({ models });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch models: ${err.message}` },
      { status: 502 }
    );
  }
}

