import { NextRequest, NextResponse } from "next/server";
import { runAgentStage } from "@/lib/services/codingAgent";
import type { AIRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: AIRequest = await req.json();
    const result = await runAgentStage(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Agent execution failed: ${err.message}` },
      { status: 500 }
    );
  }
}

