import { NextRequest, NextResponse } from "next/server";
import { listSolutions, saveSolution } from "@/lib/services/solutionService";

export async function GET() {
  try {
    const solutions = await listSolutions();
    return NextResponse.json({ solutions });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to list solutions: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const solution = await saveSolution(body);
    return NextResponse.json(solution);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to save solution: ${err.message}` },
      { status: 500 }
    );
  }
}

