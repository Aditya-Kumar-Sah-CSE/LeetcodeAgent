/**
 * Local storage service for preferences and lightweight data.
 * IndexedDB (via idb-keyval) for larger data like solutions and history.
 */

import { get, set, del, keys } from "idb-keyval";
import type { StoredSolution, ActivityEntry, ChatMessage, ChatSession } from "./types";

// ─── LocalStorage (preferences) ───────────────────────────

const LS_KEYS = {
  theme: "lca-theme",
  language: "lca-language",
  modelId: "lca-model-id",
  provider: "lca-provider",
  username: "lca-username",
  dailyCache: "lca-daily-cache",
  dailyCacheDate: "lca-daily-cache-date",
  apiKeyHash: "lca-api-key-configured",
  geminiKey: "lca-gemini-key",
  groqKey: "lca-groq-key",
  openrouterKey: "lca-openrouter-key",
  activeProvider: "lca-active-provider",
  editorFontSize: "lca-editor-font-size",
  editorWordWrap: "lca-editor-word-wrap",
  githubToken: "lca-github-token",
  githubRepo: "lca-github-repo",
  uiDensity: "lca-ui-density",
} as const;

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getTheme(): string {
  if (!isClient()) return "dark";
  return localStorage.getItem(LS_KEYS.theme) || "dark";
}

export function setTheme(theme: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.theme, theme);
}

export function getLanguage(): string {
  if (!isClient()) return "python";
  return localStorage.getItem(LS_KEYS.language) || "python";
}

export function setLanguage(lang: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.language, lang);
}

export function getModelId(): string {
  if (!isClient()) return "gemini-3-flash-preview";
  const saved = localStorage.getItem(LS_KEYS.modelId);
  if (saved && saved.trim() && saved !== "autonomous/local-engine") return saved.trim();
  if (getGeminiApiKey()) return "gemini-3-flash-preview";
  if (getGroqApiKey()) return "openai/gpt-oss-120b";
  if (getOpenRouterApiKey()) return "openrouter/free";
  return saved || "gemini-3-flash-preview";
}

export function setModelId(id: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.modelId, id);
}

export function getUsername(): string {
  if (!isClient()) return "Aditya_Kumar_Sah-28";
  return localStorage.getItem(LS_KEYS.username) || "Aditya_Kumar_Sah-28";
}

export function setUsername(username: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.username, username);
}

export function getDailyCacheDate(): string {
  if (!isClient()) return "";
  return localStorage.getItem(LS_KEYS.dailyCacheDate) || "";
}

export function setDailyCacheDate(date: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.dailyCacheDate, date);
}

export function getEditorFontSize(): number {
  if (!isClient()) return 13;
  const size = parseInt(localStorage.getItem(LS_KEYS.editorFontSize) || "13", 10);
  return isNaN(size) ? 13 : Math.min(24, Math.max(10, size));
}

export function setEditorFontSize(size: number) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.editorFontSize, size.toString());
}

export function getEditorWordWrap(): boolean {
  if (!isClient()) return true;
  const val = localStorage.getItem(LS_KEYS.editorWordWrap);
  if (val === null) return true;
  return val === "true";
}

export function setEditorWordWrap(wrap: boolean) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.editorWordWrap, wrap ? "true" : "false");
}

export type UiDensity = "compact" | "medium" | "standard";

export function getUiDensity(): UiDensity {
  if (!isClient()) return "compact";
  return (localStorage.getItem(LS_KEYS.uiDensity) as UiDensity) || "compact";
}

export function setUiDensity(density: UiDensity) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.uiDensity, density);
  applyUiDensity(density);
}

export function applyUiDensity(density?: UiDensity) {
  if (typeof document === "undefined") return;
  const d = density || getUiDensity();
  document.documentElement.setAttribute("data-density", d);
}

// ─── Draft persistence ────────────────────────────────────

export function getDraftCode(slug: string, lang: string): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(`lca-draft:${slug}:${lang}`);
}

export function saveDraftCode(slug: string, lang: string, code: string) {
  if (!isClient()) return;
  if (slug && lang) {
    localStorage.setItem(`lca-draft:${slug}:${lang}`, code);
  }
}

export function clearDraftCode(slug: string, lang: string) {
  if (!isClient()) return;
  localStorage.removeItem(`lca-draft:${slug}:${lang}`);
}

// ─── Multi-Provider API Key Configuration ────────────────────

let _sessionApiKey: string | null = null;

export function getEnvGeminiKey(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  }
  return "";
}

export function getEnvGroqKey(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || "";
  }
  return "";
}

export function getEnvOpenRouterKey(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";
  }
  return "";
}

export function getGeminiApiKey(): string {
  if (!isClient()) return getEnvGeminiKey();
  const local = localStorage.getItem(LS_KEYS.geminiKey);
  if (local && local.trim()) return local.trim();
  const envKey = getEnvGeminiKey();
  if (envKey && envKey.trim()) {
    try {
      localStorage.setItem(LS_KEYS.geminiKey, envKey.trim());
    } catch {}
    return envKey.trim();
  }
  return "";
}

export function setGeminiApiKey(key: string) {
  if (!isClient()) return;
  if (key) {
    localStorage.setItem(LS_KEYS.geminiKey, key.trim());
  } else {
    localStorage.removeItem(LS_KEYS.geminiKey);
  }
}

export function getGroqApiKey(): string {
  if (!isClient()) return getEnvGroqKey();
  const local = localStorage.getItem(LS_KEYS.groqKey);
  if (local && local.trim()) return local.trim();
  const envKey = getEnvGroqKey();
  if (envKey && envKey.trim()) {
    try {
      localStorage.setItem(LS_KEYS.groqKey, envKey.trim());
    } catch {}
    return envKey.trim();
  }
  return "";
}

export function setGroqApiKey(key: string) {
  if (!isClient()) return;
  if (key) {
    localStorage.setItem(LS_KEYS.groqKey, key.trim());
  } else {
    localStorage.removeItem(LS_KEYS.groqKey);
  }
}

export function getOpenRouterApiKey(): string {
  if (!isClient()) return getEnvOpenRouterKey();
  const local = localStorage.getItem(LS_KEYS.openrouterKey);
  if (local && local.trim()) return local.trim();
  if (_sessionApiKey && _sessionApiKey.trim()) return _sessionApiKey.trim();
  const envKey = getEnvOpenRouterKey();
  if (envKey && envKey.trim()) {
    try {
      localStorage.setItem(LS_KEYS.openrouterKey, envKey.trim());
    } catch {}
    return envKey.trim();
  }
  return "";
}

export function setOpenRouterApiKey(key: string) {
  _sessionApiKey = key ? key.trim() : null;
  if (!isClient()) return;
  if (key) {
    localStorage.setItem(LS_KEYS.openrouterKey, key.trim());
  } else {
    localStorage.removeItem(LS_KEYS.openrouterKey);
  }
}

export function getActiveProvider(): string {
  if (!isClient()) return "gemini";
  const p = localStorage.getItem(LS_KEYS.activeProvider);
  if (p && p !== "local") return p;
  if (getGeminiApiKey()) return "gemini";
  return p || "auto";
}

export function setActiveProvider(provider: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.activeProvider, provider);
}

export function getApiKey(): string {
  return getOpenRouterApiKey() || getGeminiApiKey() || getGroqApiKey() || _sessionApiKey || "";
}

export function setApiKey(key: string) {
  setOpenRouterApiKey(key);
  if (isClient()) {
    localStorage.setItem(LS_KEYS.apiKeyHash, key ? "configured" : "");
  }
}

export function isApiKeyConfigured(): boolean {
  return !!(getGeminiApiKey() || getGroqApiKey() || getOpenRouterApiKey() || _sessionApiKey);
}

export function isModelKeyConfigured(model?: { id: string; required_key?: string; tier?: string } | null): boolean {
  if (!model) return false;
  const reqKey = model.required_key || (
    model.id.includes("gemini") ? "gemini" :
    (model.id.includes("groq") || model.id.includes("llama-3") || model.id.includes("deepseek-r1-distill")) ? "groq" :
    model.id.includes("local") || model.tier === "local" ? "none" :
    "openrouter"
  );
  if (reqKey === "none") return true;
  if (reqKey === "gemini") return Boolean(getGeminiApiKey());
  if (reqKey === "groq") return Boolean(getGroqApiKey());
  if (reqKey === "openrouter") return Boolean(getOpenRouterApiKey() || getApiKey());
  return false;
}

// ─── GitHub Token & Repo Configuration ────────────────────

export function getGithubToken(): string {
  if (!isClient()) return "";
  return localStorage.getItem(LS_KEYS.githubToken) || "";
}

export function setGithubToken(token: string) {
  if (!isClient()) return;
  if (token) {
    localStorage.setItem(LS_KEYS.githubToken, token.trim());
  } else {
    localStorage.removeItem(LS_KEYS.githubToken);
  }
}

export function getGithubRepo(): string {
  if (!isClient()) return "Aditya-Kumar-Sah-CSE/LeetcodeAgent";
  return localStorage.getItem(LS_KEYS.githubRepo) || "Aditya-Kumar-Sah-CSE/LeetcodeAgent";
}

export function setGithubRepo(repo: string) {
  if (!isClient()) return;
  localStorage.setItem(LS_KEYS.githubRepo, repo.trim());
}

// ─── IndexedDB (solutions, chat sessions, history) ─────────

const IDB_PREFIX = {
  solution: "sol:",
  activity: "act:",
  problem: "prob:",
  chat: "chat:",
};

// Chat Sessions
export async function saveChatSessionLocal(
  slug: string,
  messages: ChatMessage[],
  problemTitle?: string,
  syncedToGithub = false
): Promise<void> {
  if (!slug || typeof window === "undefined") return;
  const session: ChatSession = {
    slug,
    problem_title: problemTitle,
    messages,
    updated_at: new Date().toISOString(),
    synced_to_github: syncedToGithub,
  };
  await set(`${IDB_PREFIX.chat}${slug}`, session);
}

export async function getChatSessionLocal(slug: string): Promise<ChatSession | null> {
  if (!slug || typeof window === "undefined") return null;
  const session = await get<ChatSession>(`${IDB_PREFIX.chat}${slug}`);
  return session || null;
}

export async function clearChatSessionLocal(slug: string): Promise<void> {
  if (!slug || typeof window === "undefined") return;
  await del(`${IDB_PREFIX.chat}${slug}`);
}

// Solutions
export async function saveSolutionLocal(solution: StoredSolution): Promise<void> {
  if (typeof window === "undefined") return;
  await set(`${IDB_PREFIX.solution}${solution.id}`, solution);
}

export async function getSolutionLocal(
  slug: string,
  language: string
): Promise<StoredSolution | undefined> {
  if (typeof window === "undefined") return undefined;
  return get(`${IDB_PREFIX.solution}${slug}-${language}`);
}

export async function getAllSolutionsLocal(): Promise<StoredSolution[]> {
  if (typeof window === "undefined") return [];
  const allKeys = await keys();
  const solutionKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(IDB_PREFIX.solution)
  );
  const solutions: StoredSolution[] = [];
  for (const key of solutionKeys) {
    const val = await get<StoredSolution>(key);
    if (val) solutions.push(val);
  }
  return solutions.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function deleteSolutionLocal(
  slug: string,
  language: string
): Promise<void> {
  if (typeof window === "undefined") return;
  await del(`${IDB_PREFIX.solution}${slug}-${language}`);
}

// Activity
export async function addActivity(entry: Omit<ActivityEntry, "id">): Promise<void> {
  if (typeof window === "undefined") return;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await set(`${IDB_PREFIX.activity}${id}`, { ...entry, id });
}

export async function getActivities(limit = 50): Promise<ActivityEntry[]> {
  if (typeof window === "undefined") return [];
  const allKeys = await keys();
  const actKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(IDB_PREFIX.activity)
  );
  const entries: ActivityEntry[] = [];
  for (const key of actKeys) {
    const val = await get<ActivityEntry>(key);
    if (val) entries.push(val);
  }
  return entries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

// Data management
export async function exportAllData(): Promise<string> {
  if (!isClient()) return "{}";
  const allKeys = await keys();
  const data: Record<string, unknown> = {};

  // LocalStorage
  const lsData: Record<string, string> = {};
  for (const [, val] of Object.entries(LS_KEYS)) {
    const v = localStorage.getItem(val);
    if (v) lsData[val] = v;
  }
  data.localStorage = lsData;

  // IndexedDB
  const idbData: Record<string, unknown> = {};
  for (const key of allKeys) {
    if (typeof key === "string") {
      idbData[key] = await get(key);
    }
  }
  data.indexedDB = idbData;
  data.version = 1;
  data.exportedAt = new Date().toISOString();

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonStr: string): Promise<void> {
  if (!isClient()) return;
  const data = JSON.parse(jsonStr);

  // Restore localStorage
  if (data.localStorage) {
    for (const [key, val] of Object.entries(data.localStorage)) {
      if (typeof val === "string") {
        localStorage.setItem(key, val);
      }
    }
  }

  // Restore IndexedDB
  if (data.indexedDB) {
    for (const [key, val] of Object.entries(data.indexedDB)) {
      await set(key, val);
    }
  }
}

export async function clearAllData(): Promise<void> {
  if (!isClient()) return;
  for (const val of Object.values(LS_KEYS)) {
    localStorage.removeItem(val);
  }

  const allLsKeys = Object.keys(localStorage);
  for (const k of allLsKeys) {
    if (k.startsWith("lca-draft:")) {
      localStorage.removeItem(k);
    }
  }

  const allKeys = await keys();
  for (const key of allKeys) {
    await del(key);
  }

  _sessionApiKey = null;
}

// ─── Solved Problems Status Tracking ────────────────────────

const LS_SOLVED_KEY = "lca-solved-problem-slugs";

const INITIAL_SOLVED_SLUGS: string[] = [
  "count-servers-that-communicate",
  "process-tasks-using-servers",
  "count-zero-request-servers",
  "find-the-distance-value-between-two-arrays",
  "minimum-operations-to-make-elements-within-k-subarrays-equal",
  "minimum-moves-to-equal-array-elements-iii",
  "minimum-moves-to-equal-array-elements-ii",
  "minimum-moves-to-equal-array-elements",
  "twisted-mirror-path-count",
  "shortest-path-with-at-most-k-consecutive-identical-characters",
  "palindromic-path-queries-in-a-tree",
  "remove-duplicates-from-sorted-list",
  "climbing-stairs",
  "add-binary",
  "plus-one",
  "minimum-xor-path-in-a-grid",
  "length-of-last-word",
  "find-the-index-of-the-first-occurrence-in-a-string",
  "difference-between-peaks-and-valleys",
  "count-frequency-staircase-subarrays-i",
  "count-islands-with-total-value-divisible-by-k",
  "two-sum",
  "palindrome-number",
  "valid-parentheses",
  "search-in-rotated-sorted-array",
  "search-in-rotated-sorted-array-ii",
  "maximum-subarray",
  "running-sum-of-1d-array",
  "find-peak-element",
  "find-minimum-in-rotated-sorted-array-ii",
  "search-insert-position",
  "guess-number-higher-or-lower",
  "sqrtx",
  "search-a-2d-matrix",
  "single-element-in-a-sorted-array",
  "number-of-islands",
];

function notifySolvedSlugsChanged(slugs: Set<string>) {
  if (!isClient()) return;
  try {
    window.dispatchEvent(
      new CustomEvent("lca-solved-updated", { detail: { slugs: Array.from(slugs) } })
    );
  } catch {}
}

export function onSolvedSlugsChange(callback: (slugs: Set<string>) => void): () => void {
  if (!isClient()) return () => {};
  const handler = () => callback(getSolvedSlugs());
  window.addEventListener("lca-solved-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("lca-solved-updated", handler);
    window.removeEventListener("storage", handler);
  };
}

export function getSolvedSlugs(): Set<string> {
  if (!isClient()) return new Set(INITIAL_SOLVED_SLUGS);
  try {
    const raw = localStorage.getItem(LS_SOLVED_KEY);
    if (!raw) {
      localStorage.setItem(LS_SOLVED_KEY, JSON.stringify(INITIAL_SOLVED_SLUGS));
      return new Set(INITIAL_SOLVED_SLUGS);
    }
    const arr = JSON.parse(raw);
    const set = new Set(Array.isArray(arr) ? arr : INITIAL_SOLVED_SLUGS);
    // ensure initial verified slugs are included
    for (const s of INITIAL_SOLVED_SLUGS) {
      set.add(s);
    }
    return set;
  } catch {
    return new Set(INITIAL_SOLVED_SLUGS);
  }
}

export function isProblemSolved(slug: string): boolean {
  if (!slug) return false;
  return getSolvedSlugs().has(slug);
}

export function setProblemSolved(slug: string, solved: boolean) {
  if (!slug || !isClient()) return;
  const current = getSolvedSlugs();
  if (solved) {
    current.add(slug);
  } else {
    current.delete(slug);
  }
  localStorage.setItem(LS_SOLVED_KEY, JSON.stringify(Array.from(current)));
  notifySolvedSlugsChanged(current);
}

export function toggleProblemSolved(slug: string): boolean {
  if (!slug || !isClient()) return false;
  const current = getSolvedSlugs();
  const willBeSolved = !current.has(slug);
  if (willBeSolved) {
    current.add(slug);
  } else {
    current.delete(slug);
  }
  localStorage.setItem(LS_SOLVED_KEY, JSON.stringify(Array.from(current)));
  notifySolvedSlugsChanged(current);
  return willBeSolved;
}

export function syncSolvedSlugs(newSlugs: string[]) {
  if (!newSlugs || !Array.isArray(newSlugs) || !isClient()) return;
  const current = getSolvedSlugs();
  for (const s of newSlugs) {
    if (s) current.add(s);
  }
  localStorage.setItem(LS_SOLVED_KEY, JSON.stringify(Array.from(current)));
  notifySolvedSlugsChanged(current);
}

// ─── 24-Hour & Manual Sync Tracking ─────────────────────────

const LS_LAST_SYNC_KEY = "lca-last-synced-at";

export function getLastSyncTime(): number | null {
  if (!isClient()) return null;
  const raw = localStorage.getItem(LS_LAST_SYNC_KEY);
  if (!raw) return null;
  const num = parseInt(raw, 10);
  return isNaN(num) ? null : num;
}

export function setLastSyncTime(timestamp: number = Date.now()) {
  if (!isClient()) return;
  localStorage.setItem(LS_LAST_SYNC_KEY, timestamp.toString());
}

export function isSyncDue24Hr(): boolean {
  const last = getLastSyncTime();
  if (!last) return true;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return Date.now() - last >= ONE_DAY_MS;
}

export function formatLastSyncTime(timestamp: number | null): string {
  if (!timestamp) return "Never synced";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    return `${hrs}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  return `${days}d ago`;
}

// ─── Workspace Problem & State Persistence ──────────────────

const LS_WORKSPACE_PROBLEM_KEY = "lca-active-workspace-problem";

export function getActiveWorkspaceProblem(): any | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(LS_WORKSPACE_PROBLEM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveWorkspaceProblem(problem: any) {
  if (!isClient()) return;
  try {
    if (!problem) {
      localStorage.removeItem(LS_WORKSPACE_PROBLEM_KEY);
    } else {
      localStorage.setItem(LS_WORKSPACE_PROBLEM_KEY, JSON.stringify(problem));
    }
  } catch {}
}

