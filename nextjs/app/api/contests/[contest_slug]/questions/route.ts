import { NextRequest, NextResponse } from "next/server";
import { fetchContestQuestions } from "@/lib/services/leetcodeService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contest_slug: string }> }
) {
  const { contest_slug } = await params;
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  try {
    const questions = await fetchContestQuestions(contest_slug, username);
    return NextResponse.json(questions);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch contest questions: ${err.message}` },
      { status: 502 }
    );
  }
}

