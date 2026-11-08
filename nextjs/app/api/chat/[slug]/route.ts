import { NextRequest, NextResponse } from "next/server";
import { getChatHistory, saveChatHistory } from "@/lib/services/chatService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const chat = await getChatHistory(slug);
  if (!chat) {
    return NextResponse.json({ detail: `No saved chat history found for '${slug}'` }, { status: 404 });
  }
  return NextResponse.json(chat);
}

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
      Boolean(body.push_to_git)
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to save chat history: ${err.message}` },
      { status: 500 }
    );
  }
}

