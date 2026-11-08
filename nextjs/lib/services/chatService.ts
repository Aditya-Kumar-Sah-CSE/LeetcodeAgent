/**
 * Chat Session Persistence & GitHub Sync Service for Next.js.
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function getSolutionsDir(): string {
  return path.resolve(process.cwd(), "..", "solutions");
}

function formatMarkdownChatLog(slug: string, problemTitle: string, messages: any[]): string {
  const nowStr = new Date().toUTCString();
  const lines = [
    `# AI Assistant Conversation: ${problemTitle || slug}`,
    `> **Problem**: \`${slug}\`  `,
    `> **Last Updated**: ${nowStr}  `,
    `> **Total Messages**: ${messages.length}  `,
    "",
    "---",
    "",
    "## Chat Transcript",
    "",
  ];

  for (const msg of messages) {
    const role = (msg.role || "user").toUpperCase();
    const content = (msg.content || "").trim();
    const reasoning = (msg.reasoning || "").trim();
    const toolCalls = msg.tool_calls || [];

    if (role === "USER") {
      lines.push(`### 👤 User`);
      lines.push(content);
      lines.push("");
    } else {
      lines.push(`### 🤖 AI Assistant`);
      if (reasoning || toolCalls.length > 0) {
        lines.push("<details>");
        lines.push("<summary><b>🧠 Agent Reasoning & Tool Calls</b></summary>\n");
        if (reasoning) {
          lines.push(`**Thought Process:**\n\`\`\`\n${reasoning}\n\`\`\`\n`);
        }
        if (toolCalls.length > 0) {
          lines.push("**Tools Executed:**");
          for (const tc of toolCalls) {
            lines.push(`- \`🛠️ ${tc.label || tc.name}\`: ${tc.result || ""}`);
          }
          lines.push("");
        }
        lines.push("</details>\n");
      }
      lines.push(content);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export async function saveChatHistory(
  slug: string,
  messages: any[],
  problemTitle = "",
  pushToGit = false
): Promise<{ success: boolean; json_path: string; markdown_path: string; git_pushed?: boolean; git_message?: string }> {
  const dir = getSolutionsDir();
  const folder = path.join(dir, slug);
  await fs.mkdir(folder, { recursive: true });

  const jsonPath = path.join(folder, "chat.json");
  const mdPath = path.join(folder, "CHAT.md");

  const sessionData = {
    slug,
    problem_title: problemTitle || slug,
    total_messages: messages.length,
    updated_at: new Date().toISOString(),
    messages,
  };

  await fs.writeFile(jsonPath, JSON.stringify(sessionData, null, 2), "utf-8");
  await fs.writeFile(mdPath, formatMarkdownChatLog(slug, problemTitle, messages), "utf-8");

  let gitPushed = false;
  let gitMessage = "Local chat session saved.";

  if (pushToGit) {
    try {
      const commitMsg = `docs(ai): record problem solver chat session for ${problemTitle || slug}`;
      await execAsync(`git add "${jsonPath}" "${mdPath}"`, { cwd: path.resolve(process.cwd(), "..") });
      await execAsync(`git commit -m "${commitMsg}"`, { cwd: path.resolve(process.cwd(), "..") });
      await execAsync(`git push origin main`, { cwd: path.resolve(process.cwd(), "..") });
      gitPushed = true;
      gitMessage = "Successfully committed and pushed chat log to GitHub repo.";
    } catch (err: any) {
      gitMessage = `Saved locally. Git push note: ${err.message || err}`;
    }
  }

  return {
    success: true,
    json_path: jsonPath,
    markdown_path: mdPath,
    git_pushed: gitPushed,
    git_message: gitMessage,
  };
}

export async function getChatHistory(slug: string): Promise<any | null> {
  const dir = getSolutionsDir();
  const jsonPath = path.join(dir, slug, "chat.json");

  try {
    const raw = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

