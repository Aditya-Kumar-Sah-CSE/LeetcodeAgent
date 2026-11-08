import { NextRequest, NextResponse } from "next/server";
import { fetchPublicProfile } from "@/lib/services/profileService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    const profile = await fetchPublicProfile(username);
    if (!profile) {
      return NextResponse.json(
        { detail: `User '${username}' not found on LeetCode` },
        { status: 404 }
      );
    }
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Failed to fetch profile: ${err.message}` },
      { status: 502 }
    );
  }
}

