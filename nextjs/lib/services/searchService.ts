/**
 * Web Search Service (DuckDuckGo integration with safe fallback).
 */

import type { SearchResult } from "../types";

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<{ query: string; results: SearchResult[]; error?: string }> {
  try {
    const encoded = encodeURIComponent(`${query} leetcode algorithm`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const results: SearchResult[] = [];
      const linkRegex = /<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

      const links: string[] = [];
      const titles: string[] = [];
      const snippets: string[] = [];

      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(html)) !== null && links.length < maxResults) {
        let u = match[1];
        if (u.includes("uddg=")) {
          const m = u.match(/uddg=([^&]+)/);
          if (m) u = decodeURIComponent(m[1]);
        }
        links.push(u);
        titles.push(match[2].replace(/<[^>]+>/g, "").trim());
      }

      while ((match = snippetRegex.exec(html)) !== null && snippets.length < maxResults) {
        snippets.push(match[1].replace(/<[^>]+>/g, "").trim());
      }

      for (let i = 0; i < links.length; i++) {
        results.push({
          title: titles[i] || `LeetCode Solution / Discussion ${i + 1}`,
          url: links[i],
          snippet: snippets[i] || `Optimal algorithm and approach details for ${query}`,
        });
      }

      if (results.length > 0) {
        return { query, results };
      }
    }
  } catch (err: any) {
    console.warn("DuckDuckGo HTML search error, using structured links:", err.message);
  }

  return {
    query,
    results: [
      {
        title: `LeetCode Editorial & Approach: ${query}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query + " leetcode algorithm")}`,
        snippet: `Explore community discussions, optimal time/space complexity, and patterns for ${query}.`,
      },
      {
        title: "LeetCode Discussion Solutions",
        url: "https://leetcode.com/discuss/",
        snippet: "Verified user solutions, test cases, and algorithmic breakdowns.",
      },
    ],
  };
}

