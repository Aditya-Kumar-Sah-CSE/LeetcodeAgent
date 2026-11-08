import { NextResponse } from "next/server";
import { fetchTopicTags } from "@/lib/services/leetcodeService";

export async function GET() {
  try {
    const topics = await fetchTopicTags();
    return NextResponse.json({ topics });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch topics: ${err.message}` },
      { status: 502 }
    );
  }
}

