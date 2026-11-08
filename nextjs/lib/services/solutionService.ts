/**
 * Solution Service for Next.js API Routes.
 * Manages solutions directory and manifest.json file persistence.
 */

import fs from "fs/promises";
import path from "path";
import type { SolutionFile } from "../types";

const LANG_EXTENSIONS: Record<string, string> = {
  python: ".py",
  python3: ".py",
  cpp: ".cpp",
  "c++": ".cpp",
  java: ".java",
  javascript: ".js",
  typescript: ".ts",
};

function getSolutionsDir(): string {
  // First check inside Next.js public directory (always bundled on Vercel)
  const localDir = path.join(process.cwd(), "public", "solutions");
  return localDir;
}

function makeFilename(slug: string, language: string): string {
  const ext = LANG_EXTENSIONS[language.toLowerCase()] || ".py";
  return `${slug}${ext}`;
}

export async function saveSolution(request: {
  problem_slug: string;
  problem_title: string;
  language: string;
  code: string;
}): Promise<SolutionFile> {
  const dir = getSolutionsDir();
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}

  const filename = makeFilename(request.problem_slug, request.language);
  const filepath = path.join(dir, filename);
  const now = new Date().toISOString();

  await fs.writeFile(filepath, request.code, "utf-8");

  // Also update manifest.json if present
  try {
    const manifestPath = path.join(dir, "manifest.json");
    let manifestData: any[] = [];
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      manifestData = JSON.parse(raw);
    } catch {}

    const existingIdx = manifestData.findIndex((m) => m.slug === request.problem_slug);
    const entry = {
      slug: request.problem_slug,
      title: request.problem_title,
      language: request.language,
      code_python: request.language === "python" ? request.code : undefined,
      solved_at: now,
      date: now.split("T")[0],
    };

    if (existingIdx >= 0) {
      manifestData[existingIdx] = { ...manifestData[existingIdx], ...entry };
    } else {
      manifestData.push(entry);
    }

    await fs.writeFile(manifestPath, JSON.stringify(manifestData, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not update solutions/manifest.json:", err);
  }

  return {
    problem_slug: request.problem_slug,
    problem_title: request.problem_title,
    language: request.language,
    filename,
    code: request.code,
    created_at: now,
    updated_at: now,
  };
}

export async function getSolution(slug: string, language: string): Promise<SolutionFile | null> {
  const dir = getSolutionsDir();
  const filename = makeFilename(slug, language);
  const filepath = path.join(dir, filename);

  try {
    const code = await fs.readFile(filepath, "utf-8");
    const stat = await fs.stat(filepath);
    return {
      problem_slug: slug,
      problem_title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      language,
      filename,
      code,
      created_at: stat.birthtime.toISOString(),
      updated_at: stat.mtime.toISOString(),
    };
  } catch {
    // Check subdirectories
    try {
      const subdirs = await fs.readdir(dir, { withFileTypes: true });
      const ext = LANG_EXTENSIONS[language.toLowerCase()] || ".py";
      for (const d of subdirs) {
        if (d.isDirectory() && d.name.includes(slug)) {
          const subfile = path.join(dir, d.name, `solution${ext}`);
          try {
            const code = await fs.readFile(subfile, "utf-8");
            const stat = await fs.stat(subfile);
            return {
              problem_slug: slug,
              problem_title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              language,
              filename: `solution${ext}`,
              code,
              created_at: stat.birthtime.toISOString(),
              updated_at: stat.mtime.toISOString(),
            };
          } catch {}
        }
      }
    } catch {}
  }

  return null;
}

export async function listSolutions(): Promise<SolutionFile[]> {
  const dir = getSolutionsDir();
  const solutions: SolutionFile[] = [];

  // First, check manifest.json
  try {
    const manifestPath = path.join(dir, "manifest.json");
    const raw = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    if (Array.isArray(manifest)) {
      for (const m of manifest) {
        const slug = m.slug || m.problem_slug;
        if (!slug) continue;
        const title = m.title || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const code = m.code_python || m.code || "";
        solutions.push({
          problem_slug: slug,
          problem_title: title,
          language: "python",
          filename: "solution.py",
          code,
          created_at: m.solved_at || new Date().toISOString(),
          updated_at: m.solved_at || new Date().toISOString(),
        });
      }
    }
  } catch {}

  // Then also check directory files and subdirectories
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const f of entries) {
      if (f.isFile() && f.name !== "manifest.json") {
        const ext = path.extname(f.name).toLowerCase();
        let lang = "python";
        if (ext === ".cpp") lang = "cpp";
        else if (ext === ".java") lang = "java";
        else if (ext === ".js") lang = "javascript";
        else if (ext === ".ts") lang = "typescript";

        const slug = path.basename(f.name, ext);
        if (!solutions.some((s) => s.problem_slug === slug)) {
          const fullPath = path.join(dir, f.name);
          try {
            const code = await fs.readFile(fullPath, "utf-8");
            const stat = await fs.stat(fullPath);
            solutions.push({
              problem_slug: slug,
              problem_title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              language: lang,
              filename: f.name,
              code,
              created_at: stat.birthtime.toISOString(),
              updated_at: stat.mtime.toISOString(),
            });
          } catch {}
        }
      } else if (f.isDirectory() && f.name !== "books") {
        const subPath = path.join(dir, f.name);
        try {
          const subFiles = await fs.readdir(subPath);
          for (const sf of subFiles) {
            if (sf.startsWith("solution.")) {
              const ext = path.extname(sf).toLowerCase();
              let lang = "python";
              if (ext === ".cpp") lang = "cpp";
              else if (ext === ".java") lang = "java";
              else if (ext === ".js") lang = "javascript";
              else if (ext === ".ts") lang = "typescript";

              const slug = f.name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
              if (!solutions.some((s) => s.problem_slug === slug && s.language === lang)) {
                const code = await fs.readFile(path.join(subPath, sf), "utf-8");
                solutions.push({
                  problem_slug: slug,
                  problem_title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                  language: lang,
                  filename: sf,
                  code,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  return solutions;
}

export async function deleteSolution(slug: string, language: string): Promise<boolean> {
  const dir = getSolutionsDir();
  const filename = makeFilename(slug, language);
  const filepath = path.join(dir, filename);

  try {
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function solutionExists(slug: string, language: string): Promise<boolean> {
  const dir = getSolutionsDir();
  const filename = makeFilename(slug, language);
  const filepath = path.join(dir, filename);

  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

