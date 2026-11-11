import { NextRequest, NextResponse } from "next/server";
import { resolveAnyProblem } from "@/lib/services/problemResolverService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ detail: "URL, problem ID, or slug query parameter is required" }, { status: 400 });
  }

  try {
    const problem = await resolveAnyProblem(url);
    return NextResponse.json(problem);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to resolve problem: ${err.message}` },
      { status: 404 }
    );
  }
}


