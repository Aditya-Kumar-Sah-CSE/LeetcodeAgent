import { NextRequest, NextResponse } from "next/server";
import { getSolution, deleteSolution } from "@/lib/services/solutionService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") || "python";

  const solution = await getSolution(slug, language);
  if (!solution) {
    return NextResponse.json({ detail: "Solution not found" }, { status: 404 });
  }
  return NextResponse.json(solution);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") || "python";

  const deleted = await deleteSolution(slug, language);
  if (!deleted) {
    return NextResponse.json({ detail: "Solution not found" }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}

