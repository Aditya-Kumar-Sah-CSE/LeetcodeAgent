import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/services/searchService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const maxResults = parseInt(searchParams.get("max_results") || "5", 10);

  if (!q) {
    return NextResponse.json({ detail: "Query parameter 'q' is required" }, { status: 400 });
  }

  const result = await searchWeb(q, maxResults);
  return NextResponse.json(result);
}

