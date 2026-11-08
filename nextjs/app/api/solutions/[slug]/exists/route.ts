import { NextRequest, NextResponse } from "next/server";
import { solutionExists } from "@/lib/services/solutionService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") || "python";

  const exists = await solutionExists(slug, language);
  return NextResponse.json({ exists });
}

