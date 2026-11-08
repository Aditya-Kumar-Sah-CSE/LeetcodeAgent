import { NextRequest, NextResponse } from "next/server";
import { fetchCodeSnippets } from "@/lib/services/leetcodeService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const snippets = await fetchCodeSnippets(slug);
    return NextResponse.json(snippets);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch snippets: ${err.message}` },
      { status: 502 }
    );
  }
}

