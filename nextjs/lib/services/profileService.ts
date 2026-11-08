/**
 * LeetCode Public Profile Service.
 */

import type { LeetCodeProfile } from "../types";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const PROFILE_QUERY = `
query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
        username
        profile {
            realName
            userAvatar
            ranking
            reputation
        }
        submitStatsGlobal {
            acSubmissionNum {
                difficulty
                count
            }
        }
    }
    recentAcSubmissionList(username: $username, limit: 50) {
        id
        title
        titleSlug
        timestamp
    }
}
`;

export async function fetchPublicProfile(username: string): Promise<LeetCodeProfile | null> {
  if (!username || !username.trim()) return null;
  const cleanUsername = username.trim();

  try {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
      },
      body: JSON.stringify({
        query: PROFILE_QUERY,
        variables: { username: cleanUsername },
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const user = data.data?.matchedUser;
    if (!user) return null;

    const profileData = user.profile || {};
    const submitStats = user.submitStatsGlobal?.acSubmissionNum || [];
    const recentAc = data.data?.recentAcSubmissionList || [];

    const solvedSlugs = Array.from(
      new Set(
        recentAc
          .map((item: any) => item.titleSlug)
          .filter(Boolean) as string[]
      )
    );

    const solved: Record<string, number> = {};
    for (const s of submitStats) {
      if (s.difficulty && typeof s.count === "number") {
        solved[s.difficulty] = s.count;
      }
    }

    return {
      username: user.username,
      display_name: profileData.realName || user.username,
      avatar_url: profileData.userAvatar || null,
      ranking: profileData.ranking || null,
      solved_total: solved["All"] || 0,
      solved_easy: solved["Easy"] || 0,
      solved_medium: solved["Medium"] || 0,
      solved_hard: solved["Hard"] || 0,
      reputation: profileData.reputation || 0,
      verified: true,
      solved_slugs: solvedSlugs,
    };
  } catch (err) {
    console.warn(`Could not fetch profile for '${cleanUsername}':`, err);
    return null;
  }
}

