/* ─── TypeScript Types ──────────────────────────────────── */

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface DailyProblem {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  tags: string[];
  url: string;
  date: string;
  fetched_at: string;
  code_snippets?: Record<string, string>;
  is_solved?: boolean;
}

export interface ProblemBrief {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  url: string;
  is_solved?: boolean;
}

export interface TopicTag {
  name: string;
  slug: string;
}

export interface ProblemListResponse {
  total: number;
  questions: ProblemBrief[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  context_length: number | null;
  is_free: boolean;
  description: string | null;
}

export interface AIRequest {
  problem_slug: string;
  problem_title: string;
  problem_description: string;
  examples: ProblemExample[];
  constraints: string[];
  language: string;
  stage: AgentStage;
  api_key?: string;
  model_id?: string;
  previous_context?: string;
}

export interface AIResponse {
  stage: string;
  content: string;
  code: string | null;
  model_used: string;
  citations: Citation[];
  error: string | null;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SolutionFile {
  problem_slug: string;
  problem_title: string;
  language: string;
  filename: string;
  code: string;
  created_at: string;
  updated_at: string;
  id?: number;
  difficulty?: string;
  tags?: string[];
  date?: string;
  url?: string;
  concept?: string;
  trick_english?: string;
  trick_hinglish?: string;
  summary_english?: string;
  summary_hinglish?: string;
  topics_needed?: string[];
  stages_summary?: Array<{ stage: string; detail: string }>;
  folder?: string;
}

export interface StoredSolution {
  id: string; // slug-language
  problem_slug: string;
  problem_title: string;
  language: string;
  code: string;
  created_at: string;
  updated_at: string;
  problem_id?: number;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  tags?: string[];
  date?: string;
  url?: string;
  concept?: string;
  trick_english?: string;
  trick_hinglish?: string;
  summary_english?: string;
  summary_hinglish?: string;
  topics_needed?: string[];
  stages_summary?: Array<{ stage: string; detail: string }>;
  folder?: string;
  source?: "github" | "local";
}

export interface ActivityEntry {
  id: string;
  type: "solve" | "research" | "view" | "save";
  problem_slug: string;
  problem_title: string;
  language?: string;
  timestamp: string;
  details?: string;
}

export interface LeetCodeProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  ranking: number | null;
  solved_total: number | null;
  solved_easy: number | null;
  solved_medium: number | null;
  solved_hard: number | null;
  reputation: number | null;
  verified: boolean;
  solved_slugs?: string[];
}

export type AgentStage =
  | "understand"
  | "research"
  | "plan"
  | "generate"
  | "validate"
  | "explain";

export type SupportedLanguage =
  | "python"
  | "cpp"
  | "java"
  | "javascript"
  | "typescript";

export const LANGUAGES: { value: SupportedLanguage; label: string; monacoLang: string; ext: string }[] = [
  { value: "python", label: "Python", monacoLang: "python", ext: "py" },
  { value: "cpp", label: "C++", monacoLang: "cpp", ext: "cpp" },
  { value: "java", label: "Java", monacoLang: "java", ext: "java" },
  { value: "javascript", label: "JavaScript", monacoLang: "javascript", ext: "js" },
  { value: "typescript", label: "TypeScript", monacoLang: "typescript", ext: "ts" },
];

export const AGENT_STAGES: { key: AgentStage; label: string; icon: string; description: string }[] = [
  { key: "understand", label: "Understand", icon: "🔍", description: "Deconstruct problem statement, inputs, edge cases, and constraints." },
  { key: "research", label: "Research", icon: "📚", description: "Explore canonical algorithmic patterns, data structures, and trade-offs." },
  { key: "plan", label: "Plan", icon: "📋", description: "Formulate step-by-step logic, state transitions, and pseudocode." },
  { key: "generate", label: "Generate", icon: "⚡", description: "Produce optimal, clean, production-ready solution code." },
  { key: "validate", label: "Validate", icon: "✅", description: "Trace against example test cases and verify time/space complexities." },
  { key: "explain", label: "Explain", icon: "💡", description: "Provide an intuitive explanation and complexity breakdown." },
];
