import { NextRequest, NextResponse } from "next/server";
import { saveChatHistory } from "@/lib/services/chatService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await req.json();
    const result = await saveChatHistory(
      slug,
      body.messages || [],
      body.problem_title || slug,
      true // push to git
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to push chat to GitHub: ${err.message}` },
      { status: 500 }
    );
  }
}

