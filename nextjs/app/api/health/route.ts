import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "leetcode-ai-agent-nextjs",
    framework: "Next.js Fullstack App Router",
    timestamp: new Date().toISOString(),
  });
}

