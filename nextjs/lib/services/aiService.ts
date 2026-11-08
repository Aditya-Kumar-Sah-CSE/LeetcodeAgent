/**
 * AI Service for model catalog and multi-provider chat completions.
 * Supports Google Gemini, Groq, and OpenRouter with full fallback heuristics.
 */

import type { AIModel } from "../types";

export const PRIMARY_MODELS: AIModel[] = [
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Google AI Studio)",
    provider: "Google",
    context_length: 1048576,
    is_free: true,
    tier: "low",
    specification: "Ultra Latency • 1M Context • Rapid CP Feedback",
    speed: "⚡ Ultra-Fast (<0.5s)",
    reasoning_power: "High",
    description: "Google's latest flagship high-speed model with generous free tier on Google AI Studio.",
    required_key: "gemini",
    required_key_name: "Google Gemini API Key",
    key_url: "https://aistudio.google.com/app/apikey",
    pricing_type: "100% Free (Google AI Studio)",
    token_limit: "1,048,576 Tokens (1M Ctx)",
    best_for: "Real-time coding hints, sliding window, graph algorithms",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash (Google AI Studio)",
    provider: "Google",
    context_length: 1048576,
    is_free: true,
    tier: "high",
    specification: "High Reasoning • Optimal LeetCode Solutions",
    speed: "⚡ Fast (~0.8s)",
    reasoning_power: "Maximum",
    description: "Next-gen Gemini reasoning model with deep competitive programming heuristics.",
    required_key: "gemini",
    required_key_name: "Google Gemini API Key",
    key_url: "https://aistudio.google.com/app/apikey",
    pricing_type: "100% Free (Google AI Studio)",
    token_limit: "1,048,576 Tokens (1M Ctx)",
    best_for: "Dynamic programming, advanced graph algorithms",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B (Groq LPU)",
    provider: "Groq",
    context_length: 131072,
    is_free: true,
    tier: "high",
    specification: "High Reasoning • 128K Context • 120B Parameters",
    speed: "⚡ Instant (<0.3s)",
    reasoning_power: "Maximum",
    description: "Massive 120-billion parameter model accelerated by Groq LPUs for extreme code correctness.",
    required_key: "groq",
    required_key_name: "Groq API Key",
    key_url: "https://console.groq.com/keys",
    pricing_type: "100% Free (Groq Tier)",
    token_limit: "131,072 Tokens (128K Ctx)",
    best_for: "Optimal DSA logic, complex constraints, Hard problems",
  },
  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B Coder (Groq LPU)",
    provider: "Groq",
    context_length: 131072,
    is_free: true,
    tier: "medium",
    specification: "Balanced • 128K Context • Math & CP Specialized",
    speed: "⚡ Instant (<0.3s)",
    reasoning_power: "Very High",
    description: "Specialized algorithmic reasoning and competitive programming model on Groq hardware.",
    required_key: "groq",
    required_key_name: "Groq API Key",
    key_url: "https://console.groq.com/keys",
    pricing_type: "100% Free (Groq Tier)",
    token_limit: "131,072 Tokens (128K Ctx)",
    best_for: "Competitive coding, strict constraint compliance, trees & graphs",
  },
  {
    id: "openrouter/free",
    name: "OpenRouter Auto Best Coder (Unified)",
    provider: "OpenRouter",
    context_length: 131072,
    is_free: true,
    tier: "medium",
    specification: "Balanced • 128K Context • Dynamic Best Free Model",
    speed: "🚀 Fast (~1.2s)",
    reasoning_power: "Very High",
    description: "Automatically routes requests to the highest-performing available free coding model with 99.9% uptime.",
    required_key: "openrouter",
    required_key_name: "OpenRouter API Key",
    key_url: "https://openrouter.ai/keys",
    pricing_type: "Free Tier (Rate-Limited)",
    token_limit: "131,072 Tokens (128K Ctx)",
    best_for: "Reliable all-round problem solving",
  },
];

export async function fetchAvailableModels(apiKey?: string | null): Promise<AIModel[]> {
  const models = [...PRIMARY_MODELS];
  const effectiveKey = apiKey || process.env.OPENROUTER_API_KEY;

  if (effectiveKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${effectiveKey.trim()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        for (const m of data.data || []) {
          const pricing = m.pricing || {};
          const isFree =
            parseFloat(pricing.prompt || "1") === 0 &&
            parseFloat(pricing.completion || "1") === 0;

          if (isFree && !models.some((existing) => existing.id === m.id)) {
            models.push({
              id: m.id,
              name: m.name || m.id,
              provider: m.id.split("/")[0] || "Unknown",
              context_length: m.context_length || 32768,
              is_free: true,
              tier: "medium",
              description: m.description || null,
              required_key: "openrouter",
              required_key_name: "OpenRouter API Key",
              key_url: "https://openrouter.ai/keys",
              pricing_type: "Free Tier",
              token_limit: `${((m.context_length || 32768) / 1000).toFixed(0)}K Tokens`,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote OpenRouter catalog:", err);
    }
  }

  return models;
}

export async function chatCompletion(options: {
  messages: Array<{ role: string; content: string }>;
  modelId?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { messages, modelId = "gemini-3-flash-preview", apiKey, temperature = 0.2, maxTokens = 2048 } = options;

  const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const groqKey = apiKey || process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const openRouterKey = apiKey || process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  // 1. If Google Gemini model
  if (modelId.includes("gemini") && geminiKey) {
    const cleanModel = modelId.replace(/^models\//, "").replace(/^google\//, "");
    const candidateModels = [
      cleanModel,
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let lastError = null;
    for (const mName of candidateModels) {
      try {
        const systemMsg = messages.find((m) => m.role === "system")?.content || "";
        const userMsgs = messages.filter((m) => m.role !== "system");

        const contents = userMsgs.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${encodeURIComponent(geminiKey.trim())}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
              contents,
              generationConfig: { temperature, maxOutputTokens: maxTokens },
            }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini HTTP ${res.status}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
  }

  // 2. If Groq model
  if ((modelId.startsWith("groq/") || modelId.includes("gpt-oss") || modelId.includes("qwen3.8") || modelId.includes("llama-3")) && groqKey) {
    const cleanModel = modelId.replace(/^groq\//, "");
    const candidateModels = [cleanModel, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "llama-3.1-8b-instant"];

    let lastError = null;
    for (const mName of candidateModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: mName,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Groq HTTP ${res.status}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
  }

  // 3. OpenRouter / Universal fallback
  if (openRouterKey) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey.trim()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LeetCode AI Agent Next.js",
      },
      body: JSON.stringify({
        model: modelId === "openrouter/free" ? "openrouter/auto" : modelId,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenRouter HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No API key available for completion.");
}

