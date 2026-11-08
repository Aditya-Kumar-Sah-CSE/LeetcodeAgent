import { NextRequest, NextResponse } from "next/server";
import { executeCode } from "@/lib/services/executionService";
import type { RunCodeRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: RunCodeRequest = await req.json();
    const result = await executeCode(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: "RUNTIME_ERROR",
        message: err.message || "Failed to execute code",
        total_tests: 0,
        passed_tests: 0,
        runtime_ms: 0,
        runtime_error: err.message,
        results: [],
      },
      { status: 500 }
    );
  }
}

