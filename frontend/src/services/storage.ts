/**
 * Local storage service for preferences and lightweight data.
 * IndexedDB (via idb-keyval) for larger data like solutions and history.
 */

import { get, set, del, keys } from "idb-keyval";

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
} as const;

export function getTheme(): string {
  return localStorage.getItem(LS_KEYS.theme) || "dark";
}

export function setTheme(theme: string) {
  localStorage.setItem(LS_KEYS.theme, theme);
}

export function getLanguage(): string {
  return localStorage.getItem(LS_KEYS.language) || "python";
}

export function setLanguage(lang: string) {
  localStorage.setItem(LS_KEYS.language, lang);
}

export function getModelId(): string {
  return localStorage.getItem(LS_KEYS.modelId) || "";
}

export function setModelId(id: string) {
  localStorage.setItem(LS_KEYS.modelId, id);
}

export function getUsername(): string {
  return localStorage.getItem(LS_KEYS.username) || "";
}

export function setUsername(username: string) {
  localStorage.setItem(LS_KEYS.username, username);
}

export function getDailyCacheDate(): string {
  return localStorage.getItem(LS_KEYS.dailyCacheDate) || "";
}

export function setDailyCacheDate(date: string) {
  localStorage.setItem(LS_KEYS.dailyCacheDate, date);
}

// ─── Session-only API key (not persisted to localStorage) ──

let _sessionApiKey: string | null = null;

export function getApiKey(): string {
  return _sessionApiKey || "";
}

export function setApiKey(key: string) {
  _sessionApiKey = key;
  // Store a hash marker that a key was provided, not the key itself
  localStorage.setItem(LS_KEYS.apiKeyHash, key ? "configured" : "");
}

export function isApiKeyConfigured(): boolean {
  return !!_sessionApiKey || localStorage.getItem(LS_KEYS.apiKeyHash) === "configured";
}

// ─── IndexedDB (solutions, history) ────────────────────────

export interface StoredSolution {
  id: string; // slug-language
  problem_slug: string;
  problem_title: string;
  language: string;
  code: string;
  created_at: string;
  updated_at: string;
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

const IDB_PREFIX = {
  solution: "sol:",
  activity: "act:",
  problem: "prob:",
};

// Solutions
export async function saveSolutionLocal(solution: StoredSolution): Promise<void> {
  await set(`${IDB_PREFIX.solution}${solution.id}`, solution);
}

export async function getSolutionLocal(
  slug: string,
  language: string
): Promise<StoredSolution | undefined> {
  return get(`${IDB_PREFIX.solution}${slug}-${language}`);
}

export async function getAllSolutionsLocal(): Promise<StoredSolution[]> {
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
  await del(`${IDB_PREFIX.solution}${slug}-${language}`);
}

// Activity
export async function addActivity(entry: Omit<ActivityEntry, "id">): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await set(`${IDB_PREFIX.activity}${id}`, { ...entry, id });
}

export async function getActivities(limit = 50): Promise<ActivityEntry[]> {
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
  // Clear localStorage
  for (const val of Object.values(LS_KEYS)) {
    localStorage.removeItem(val);
  }

  // Clear IndexedDB
  const allKeys = await keys();
  for (const key of allKeys) {
    await del(key);
  }

  _sessionApiKey = null;
}
