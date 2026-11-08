/**
 * Coding Agent Pipeline for Next.js.
 * Implements the 7-stage agent: understand → research → plan → generate → validate → explain → prepare.
 */

import type { AIRequest, AIResponse, Citation } from "../types";
import { chatCompletion } from "./aiService";
import { searchWeb } from "./searchService";
import { generateClientAlgorithmicSolution } from "../algorithmicAgent";

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: "Python 3",
  python3: "Python 3",
  cpp: "C++",
  "c++": "C++",
  java: "Java",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

function buildSystemPrompt(language: string): string {
  const langName = LANGUAGE_TEMPLATES[language.toLowerCase()] || language;
  return `You are an expert competitive programming assistant. You help solve LeetCode problems.

RULES:
1. Write clean, efficient, well-commented ${langName} code.
2. Always preserve the EXACT function signature required by LeetCode.
3. For Python: use \`class Solution\` with the exact method signature.
4. For C++: use \`class Solution\` with the exact method signature.
5. For Java: use \`class Solution\` with the exact method signature.
6. For JavaScript/TypeScript: use the exact function signature provided.
7. Include necessary imports at the top.
8. Explain your approach clearly.
9. Analyze time and space complexity.
10. Consider edge cases.
11. Do NOT generate standalone programs - only the solution class/function.
12. When providing code, wrap it in \`\`\`${language.toLowerCase()} code blocks.`;
}

function formatExamples(request: AIRequest): string {
  if (!request.examples || request.examples.length === 0) return "(No examples provided)";
  return request.examples
    .map((ex, idx) => `Example ${idx + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}${ex.explanation ? `\n  Explanation: ${ex.explanation}` : ""}`)
    .join("\n");
}

function formatConstraints(request: AIRequest): string {
  if (!request.constraints || request.constraints.length === 0) return "(No constraints provided)";
  return request.constraints.map((c) => `- ${c}`).join("\n");
}

function extractCode(responseText: string, language: string): string | null {
  const lang = language.toLowerCase();
  const pattern = new RegExp(`\`\`\`(?:${lang}|cpp|java|python|javascript|typescript|js|ts)?\\s*([\\s\\S]*?)\`\`\``, "i");
  const match = pattern.exec(responseText);
  if (match) {
    return match[1].trim();
  }
  return null;
}

export async function runAgentStage(request: AIRequest): Promise<AIResponse> {
  const stage = request.stage;
  const langName = LANGUAGE_TEMPLATES[request.language.toLowerCase()] || request.language;
  const sysPrompt = buildSystemPrompt(request.language);

  const hasKey = Boolean(
    request.api_key ||
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );

  if (!hasKey) {
    return generateClientAlgorithmicSolution(request);
  }

  try {
    if (stage === "research") {
      const searchRes = await searchWeb(request.problem_title);
      const citations: Citation[] = searchRes.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      }));

      const citationText = citations.map((c, i) => `[${i + 1}] ${c.title} (${c.url}): ${c.snippet}`).join("\n");
      const userPrompt = `Research optimal approaches for "${request.problem_title}":
${request.problem_description}
Constraints: ${formatConstraints(request)}

Web citations:
${citationText}

Provide:
1. Algorithm patterns (e.g. Two Pointers, Dynamic Programming, Monotonic Queue)
2. Data structures and why they are chosen
3. Time and Space complexities
4. Cite findings using [n] notation.`;

      const responseText = await chatCompletion({
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
        modelId: request.model_id,
        apiKey: request.api_key,
      });

      return {
        stage: "research",
        content: responseText,
        code: null,
        model_used: request.model_id || "default",
        citations,
        error: null,
      };
    }

    let userPrompt = "";
    if (stage === "understand") {
      userPrompt = `Analyze this LeetCode problem:
**${request.problem_title}**
${request.problem_description}
Examples:
${formatExamples(request)}
Constraints:
${formatConstraints(request)}

Please breakdown:
1. Input/Output formats
2. Key constraints and what they imply for time complexity
3. Edge cases to guard against
4. Classification of problem type`;
    } else if (stage === "plan") {
      userPrompt = `Plan a solution in ${langName} for:
**${request.problem_title}**
${request.problem_description}
${request.previous_context ? `Previous context:\n${request.previous_context}` : ""}

Provide:
1. Chosen algorithm and justification
2. Step-by-step logic
3. Expected Time and Space complexity
4. Pseudocode outline`;
    } else if (stage === "generate") {
      userPrompt = `Generate a complete, optimal ${langName} solution for:
**${request.problem_title}**
${request.problem_description}
Examples:
${formatExamples(request)}
${request.previous_context ? `Plan:\n${request.previous_context}` : ""}

Return ONLY the code block inside \`\`\`${request.language} ... \`\`\`. Preserve exact LeetCode class/function signatures.`;
    } else if (stage === "validate") {
      userPrompt = `Validate this ${langName} solution for "${request.problem_title}":
Code:
${request.previous_context}

Check:
1. Exact function signature match
2. Walk through test cases
3. Corner cases (empty inputs, min/max values)
4. Confirm time/space bounds`;
    } else if (stage === "explain") {
      userPrompt = `Explain this ${langName} solution for "${request.problem_title}":
Code:
${request.previous_context}

Provide:
1. Intuition in plain words
2. Line-by-line breakdown
3. Time and Space complexity analysis
4. Dry run with Example 1`;
    }

    const responseText = await chatCompletion({
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      modelId: request.model_id,
      apiKey: request.api_key,
    });

    let code: string | null = null;
    if (stage === "generate") {
      code = extractCode(responseText, request.language);
      if (!code) {
        const fallbackAlgo = generateClientAlgorithmicSolution(request);
        code = fallbackAlgo.code;
      }
    }

    return {
      stage,
      content: responseText,
      code,
      model_used: request.model_id || "default",
      citations: [],
      error: null,
    };
  } catch (err: any) {
    console.warn(`Agent stage '${stage}' failed (${err.message}); using Algorithmic Fallback.`);
    const fallback = generateClientAlgorithmicSolution(request);
    fallback.content = `${fallback.content}\n\n*(Auto-resolved via Autonomous Algorithmic Engine — Notice: ${err.message})*`;
    return fallback;
  }
}

