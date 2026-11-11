import { NextRequest, NextResponse } from "next/server";
import { resolveAnyProblem } from "@/lib/services/problemResolverService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const problem = await resolveAnyProblem(slug);
    return NextResponse.json(problem);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch problem '${slug}': ${err.message}` },
      { status: 404 }
    );
  }
}


