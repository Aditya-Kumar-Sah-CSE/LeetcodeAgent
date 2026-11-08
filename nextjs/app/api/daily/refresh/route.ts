import { NextResponse } from "next/server";
import { fetchDailyChallenge, clearDailyCache } from "@/lib/services/leetcodeService";

export async function POST() {
  clearDailyCache();
  try {
    const daily = await fetchDailyChallenge();
    return NextResponse.json(daily);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to refresh daily challenge: ${err.message}` },
      { status: 502 }
    );
  }
}

