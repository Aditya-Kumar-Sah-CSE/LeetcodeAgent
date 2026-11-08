import { NextRequest, NextResponse } from "next/server";
import { fetchProblemBySlug } from "@/lib/services/leetcodeService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const problem = await fetchProblemBySlug(slug);
    return NextResponse.json(problem);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch problem '${slug}': ${err.message}` },
      { status: 404 }
    );
  }
}

