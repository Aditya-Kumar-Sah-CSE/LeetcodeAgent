import { NextRequest, NextResponse } from "next/server";
import { fetchContests } from "@/lib/services/leetcodeService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "1000", 10);

  try {
    const contests = await fetchContests(limit);
    return NextResponse.json(contests);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch contests: ${err.message}` },
      { status: 502 }
    );
  }
}

