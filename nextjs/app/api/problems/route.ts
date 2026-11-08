import { NextRequest, NextResponse } from "next/server";
import { fetchPracticeProblems } from "@/lib/services/leetcodeService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const difficulty = searchParams.get("difficulty");
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const search = searchParams.get("search");
  const username = searchParams.get("username");

  try {
    const data = await fetchPracticeProblems({
      difficulty,
      topic,
      limit,
      skip,
      search,
      username,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch problems: ${err.message}` },
      { status: 502 }
    );
  }
}

