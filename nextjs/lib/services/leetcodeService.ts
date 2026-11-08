/**
 * LeetCode Service for Next.js Fullstack API routes.
 * Interacts directly with LeetCode's public GraphQL endpoint.
 */

import type {
  DailyProblem,
  ProblemExample,
  ProblemBrief,
  TopicTag,
  ProblemListResponse,
  ContestBrief,
  ContestQuestion,
} from "../types";
import { fetchPublicProfile } from "./profileService";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const DAILY_CHALLENGE_QUERY = `
query questionOfToday {
    activeDailyCodingChallengeQuestion {
        date
        link
        question {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            content
            topicTags {
                name
                slug
            }
            codeSnippets {
                lang
                langSlug
                code
            }
        }
    }
}
`;

const PROBLEM_DETAIL_QUERY = `
query questionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        titleSlug
        difficulty
        content
        topicTags {
            name
            slug
        }
        codeSnippets {
            lang
            langSlug
            code
        }
        hints
    }
}
`;

const PROBLEMSET_QUERY = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
    ) {
        total: totalNum
        questions: data {
            questionId
            questionFrontendId
            title
            titleSlug
            difficulty
            topicTags {
                name
                slug
            }
        }
    }
}
`;

const TOPIC_TAGS_QUERY = `
query getTopicTags {
    questionTopicTags {
        edges {
            node {
                name
                slug
            }
        }
    }
}
`;

const ALL_CONTESTS_QUERY = `
query {
    allContests {
        title
        titleSlug
        startTime
        duration
        originStartTime
        isVirtual
    }
}
`;

const CONTEST_QUESTIONS_QUERY = `
query contestQuestions($titleSlug: String!) {
    contestQuestionList(contestSlug: $titleSlug) {
        questionId
        title
        titleSlug
        credit
    }
}
`;

let _dailyCache: DailyProblem | null = null;
let _dailyCacheDate: string | null = null;
let _topicTagsCache: TopicTag[] = [];

export function clearDailyCache() {
  _dailyCache = null;
  _dailyCacheDate = null;
}

function cleanHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseExamples(htmlContent: string): ProblemExample[] {
  const examples: ProblemExample[] = [];
  if (!htmlContent) return examples;

  const examplePattern = /<strong[^>]*>Example\s*\d*:?\s*<\/strong>([\s\S]*?)(?=<strong[^>]*>Example|<strong[^>]*>Constraints|<p><strong>Constraints|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = examplePattern.exec(htmlContent)) !== null) {
    const block = match[1];
    const inputMatch = /<strong>Input:?\s*<\/strong>\s*([\s\S]*?)(?=<strong>|<br|<\/p>)/i.exec(block);
    const outputMatch = /<strong>Output:?\s*<\/strong>\s*([\s\S]*?)(?=<strong>|<br|<\/p>)/i.exec(block);
    const explainMatch = /<strong>Explanation:?\s*<\/strong>\s*([\s\S]*?)(?=<strong>|<\/p>|$)/i.exec(block);

    const inputText = inputMatch ? cleanHtml(inputMatch[1]) : "";
    const outputText = outputMatch ? cleanHtml(outputMatch[1]) : "";
    const explanation = explainMatch ? cleanHtml(explainMatch[1]) : undefined;

    if (inputText || outputText) {
      examples.push({
        input: inputText.trim(),
        output: outputText.trim(),
        explanation: explanation ? explanation.trim() : undefined,
      });
    }
  }

  return examples;
}

function parseConstraints(htmlContent: string): string[] {
  const constraints: string[] = [];
  if (!htmlContent) return constraints;

  const match = /<strong>Constraints:?\s*<\/strong>\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>/i.exec(htmlContent);
  if (match) {
    const liPattern = /<li>([\s\S]*?)<\/li>/gi;
    let liMatch: RegExpExecArray | null;
    while ((liMatch = liPattern.exec(match[1])) !== null) {
      const cleaned = cleanHtml(liMatch[1]).trim();
      if (cleaned) constraints.push(cleaned);
    }
  }

  return constraints;
}

export function extractProblemSlug(query: string): string {
  if (!query) return "";
  const q = query.trim();
  const contestMatch = /contest\/[^/]+\/problems\/([^/?#]+)/i.exec(q);
  if (contestMatch) return contestMatch[1].trim().toLowerCase();

  const probMatch = /problems\/([^/?#]+)/i.exec(q);
  if (probMatch) return probMatch[1].trim().toLowerCase();

  const parts = q.replace(/^\/+|\/+$/g, "").split("/");
  let clean = parts[parts.length - 1].split("?")[0].split("#")[0].trim();
  if (["description", "submissions", "editorial", "solutions"].includes(clean) && parts.length > 1) {
    clean = parts[parts.length - 2].split("?")[0].split("#")[0].trim();
  }
  return clean.toLowerCase();
}

export async function fetchDailyChallenge(): Promise<DailyProblem> {
  const today = new Date().toISOString().split("T")[0];
  if (_dailyCache && _dailyCacheDate === today) {
    return _dailyCache;
  }

  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (compatible; LeetCodeAgent/1.0)",
    },
    body: JSON.stringify({ query: DAILY_CHALLENGE_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const dailyData = json.data?.activeDailyCodingChallengeQuestion;
  if (!dailyData || !dailyData.question) {
    throw new Error("No daily challenge data returned from LeetCode");
  }

  const q = dailyData.question;
  const content = q.content || "";

  const snippets: Record<string, string> = {};
  for (const s of q.codeSnippets || []) {
    const lang = (s.langSlug || "").toLowerCase();
    snippets[lang] = s.code;
    if (lang === "python3") {
      snippets["python"] = s.code;
    }
  }

  const problem: DailyProblem = {
    id: parseInt(q.questionFrontendId || q.questionId || "0", 10),
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    description: content,
    examples: parseExamples(content),
    constraints: parseConstraints(content),
    tags: (q.topicTags || []).map((t: any) => t.name),
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    date: dailyData.date || today,
    fetched_at: new Date().toISOString(),
    code_snippets: snippets,
  };

  _dailyCache = problem;
  _dailyCacheDate = today;
  return problem;
}

export async function fetchProblemBySlug(slugOrUrl: string): Promise<DailyProblem> {
  const cleanSlug = extractProblemSlug(slugOrUrl) || slugOrUrl.trim().toLowerCase();
  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/problems/${cleanSlug}/`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify({
      query: PROBLEM_DETAIL_QUERY,
      variables: { titleSlug: cleanSlug },
    }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode HTTP error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const q = json.data?.question;
  if (!q) {
    throw new Error(`Problem '${cleanSlug}' not found on LeetCode`);
  }

  const content = q.content || "";
  const today = new Date().toISOString().split("T")[0];

  const snippets: Record<string, string> = {};
  for (const s of q.codeSnippets || []) {
    const lang = (s.langSlug || "").toLowerCase();
    snippets[lang] = s.code;
    if (lang === "python3") {
      snippets["python"] = s.code;
    }
  }

  return {
    id: parseInt(q.questionFrontendId || q.questionId || "0", 10),
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    description: content,
    examples: parseExamples(content),
    constraints: parseConstraints(content),
    tags: (q.topicTags || []).map((t: any) => t.name),
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    date: today,
    fetched_at: new Date().toISOString(),
    code_snippets: snippets,
  };
}

export async function fetchCodeSnippets(slug: string): Promise<Record<string, string>> {
  const prob = await fetchProblemBySlug(slug);
  return prob.code_snippets || {};
}

export async function fetchTopicTags(): Promise<TopicTag[]> {
  if (_topicTagsCache && _topicTagsCache.length > 0) {
    return _topicTagsCache;
  }

  try {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query: TOPIC_TAGS_QUERY }),
    });

    if (res.ok) {
      const json = await res.json();
      const edges = json.data?.questionTopicTags?.edges || [];
      const tags: TopicTag[] = [];
      for (const edge of edges) {
        const node = edge?.node;
        if (node?.name && node?.slug) {
          tags.push({ name: node.name, slug: node.slug });
        }
      }
      if (tags.length > 0) {
        _topicTagsCache = tags;
        return tags;
      }
    }
  } catch (err) {
    console.warn("Could not fetch live topic tags from LeetCode, using curated defaults:", err);
  }

  return [
    { name: "Array", slug: "array" },
    { name: "String", slug: "string" },
    { name: "Hash Table", slug: "hash-table" },
    { name: "Dynamic Programming", slug: "dynamic-programming" },
    { name: "Math", slug: "math" },
    { name: "Sorting", slug: "sorting" },
    { name: "Greedy", slug: "greedy" },
    { name: "Depth-First Search", slug: "depth-first-search" },
    { name: "Binary Search", slug: "binary-search" },
    { name: "Matrix", slug: "matrix" },
    { name: "Tree", slug: "tree" },
    { name: "Breadth-First Search", slug: "breadth-first-search" },
    { name: "Bit Manipulation", slug: "bit-manipulation" },
    { name: "Two Pointers", slug: "two-pointers" },
    { name: "Prefix Sum", slug: "prefix-sum" },
    { name: "Heap (Priority Queue)", slug: "heap-priority-queue" },
    { name: "Binary Tree", slug: "binary-tree" },
    { name: "Simulation", slug: "simulation" },
    { name: "Stack", slug: "stack" },
    { name: "Graph", slug: "graph" },
    { name: "Sliding Window", slug: "sliding-window" },
    { name: "Backtracking", slug: "backtracking" },
    { name: "Union Find", slug: "union-find" },
    { name: "Linked List", slug: "linked-list" },
  ];
}

export async function fetchPracticeProblems(options: {
  difficulty?: string | null;
  topic?: string | null;
  limit?: number;
  skip?: number;
  search?: string | null;
  username?: string | null;
}): Promise<ProblemListResponse> {
  const { difficulty, topic, limit = 20, skip = 0, search, username } = options;
  const filters: Record<string, any> = {};

  if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty.toUpperCase())) {
    filters.difficulty = difficulty.toUpperCase();
  }
  if (topic && topic.toLowerCase() !== "all" && topic.trim() !== "") {
    filters.tags = [topic.toLowerCase()];
  }

  let exactMatch: ProblemBrief | null = null;
  let userSolvedSlugs = new Set<string>();

  if (username) {
    try {
      const prof = await fetchPublicProfile(username);
      if (prof && prof.solved_slugs) {
        userSolvedSlugs = new Set(prof.solved_slugs);
      }
    } catch {}
  }

  if (search && search.trim()) {
    const rawSearch = search.trim();
    const extractedSlug = extractProblemSlug(rawSearch);
    if (extractedSlug) {
      try {
        const exactP = await fetchProblemBySlug(extractedSlug);
        if (exactP) {
          exactMatch = {
            id: exactP.id,
            title: exactP.title,
            slug: exactP.slug,
            difficulty: exactP.difficulty,
            tags: exactP.tags,
            url: exactP.url,
            is_solved: userSolvedSlugs.has(exactP.slug),
          };
        }
      } catch {}
      filters.searchKeywords = extractedSlug.replace(/-/g, " ");
    } else {
      filters.searchKeywords = rawSearch;
    }
  }

  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      query: PROBLEMSET_QUERY,
      variables: {
        categorySlug: "",
        limit: Math.min(limit, 50),
        skip: Math.max(skip, 0),
        filters,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL error: ${res.status}`);
  }

  const json = await res.json();
  const result = json.data?.problemsetQuestionList || {};
  let total = result.total || 0;
  const rawQuestions = result.questions || [];

  let questions: ProblemBrief[] = rawQuestions.map((q: any) => ({
    id: parseInt(q.questionFrontendId || q.questionId || "0", 10),
    title: q.title || "",
    slug: q.titleSlug || "",
    difficulty: q.difficulty || "Medium",
    tags: (q.topicTags || []).map((t: any) => t.name).filter(Boolean),
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    is_solved: userSolvedSlugs.has(q.titleSlug),
  }));

  if (exactMatch) {
    const exactSlug = exactMatch.slug;
    questions = [exactMatch, ...questions.filter((q) => q.slug !== exactSlug)];
    total = Math.max(total, questions.length);
  }

  return { total, questions };
}

export async function fetchContests(limit = 1000): Promise<ContestBrief[]> {
  const now = Math.floor(Date.now() / 1000);
  let rawContests: any[] = [];

  try {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({ query: ALL_CONTESTS_QUERY }),
    });
    if (res.ok) {
      const json = await res.json();
      rawContests = json.data?.allContests || [];
    }
  } catch (err) {
    console.warn("Failed to fetch live contests from LeetCode:", err);
  }

  if (!rawContests || rawContests.length === 0) {
    rawContests = [
      { title: "Weekly Contest 527", titleSlug: "weekly-contest-527", startTime: now + 86400 * 3, duration: 5400, isVirtual: false },
      { title: "Biweekly Contest 195", titleSlug: "biweekly-contest-195", startTime: now + 86400 * 2, duration: 5400, isVirtual: false },
      { title: "Weekly Contest 525", titleSlug: "weekly-contest-525", startTime: now - 86400 * 2, duration: 5400, isVirtual: false },
      { title: "Biweekly Contest 194", titleSlug: "biweekly-contest-194", startTime: now - 86400 * 4, duration: 5400, isVirtual: false },
      { title: "Weekly Contest 524", titleSlug: "weekly-contest-524", startTime: now - 86400 * 9, duration: 5400, isVirtual: false },
      { title: "Weekly Contest 420", titleSlug: "weekly-contest-420", startTime: 1729391400, duration: 5400, isVirtual: false },
    ];
  }

  return rawContests.slice(0, limit).map((c: any) => {
    const st = parseInt(c.startTime || "0", 10);
    const dur = parseInt(c.duration || "5400", 10);
    let status: "UPCOMING" | "LIVE" | "PAST" = "PAST";
    if (st > now) status = "UPCOMING";
    else if (st <= now && now <= st + dur) status = "LIVE";

    return {
      title: c.title,
      slug: c.titleSlug,
      start_time: st,
      duration: dur,
      origin_start_time: parseInt(c.originStartTime || st, 10),
      is_virtual: Boolean(c.isVirtual),
      status,
      url: `https://leetcode.com/contest/${c.titleSlug}/`,
    };
  });
}

export async function fetchContestQuestions(
  contestSlug: string,
  username?: string | null
): Promise<ContestQuestion[]> {
  let userSolvedSlugs = new Set<string>();
  if (username) {
    try {
      const prof = await fetchPublicProfile(username);
      if (prof && prof.solved_slugs) {
        userSolvedSlugs = new Set(prof.solved_slugs);
      }
    } catch {}
  }

  try {
    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        query: CONTEST_QUESTIONS_QUERY,
        variables: { titleSlug: contestSlug },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const list = json.data?.contestQuestionList || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => {
          let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
          if (idx === 0) difficulty = "Easy";
          else if (idx === list.length - 1) difficulty = "Hard";

          return {
            id: String(item.questionId || idx + 1),
            title: item.title,
            slug: item.titleSlug,
            credit: item.credit || idx + 3,
            difficulty,
            url: `https://leetcode.com/problems/${item.titleSlug}/`,
            is_solved: userSolvedSlugs.has(item.titleSlug),
          };
        });
      }
    }
  } catch (err) {
    console.warn("Could not fetch contest questions from LeetCode GraphQL:", err);
  }

  return [];
}

