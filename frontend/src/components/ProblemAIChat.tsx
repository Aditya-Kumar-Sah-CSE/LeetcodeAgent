import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  GitBranch,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Terminal,
  Cpu,
  Bot,
  User,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Key,
  X,
  Zap,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { DailyProblem, ChatMessage, ToolCallItem, SupportedLanguage, AIModel } from "../types";
import {
  streamChatMessage,
  syncChatToGitHub,
  exportChatAsMarkdown,
  getDynamicSuggestions,
} from "../services/chatService";
import {
  getChatSessionLocal,
  saveChatSessionLocal,
  clearChatSessionLocal,
  getModelId,
  setModelId,
  getGeminiApiKey,
  setGeminiApiKey,
  getGroqApiKey,
  setGroqApiKey,
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getApiKey,
  setActiveProvider,
  isModelKeyConfigured,
} from "../services/storage";
import { fetchModels } from "../services/api";

interface ProblemAIChatProps {
  problem: DailyProblem | null;
  code: string;
  language: SupportedLanguage;
  onApplyCode?: (newCode: string) => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export const ProblemAIChat: React.FC<ProblemAIChatProps> = ({
  problem,
  code,
  language,
  onApplyCode,
  selectedModel: propSelectedModel,
  onModelChange,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    () => propSelectedModel || getModelId() || "gemini-2.0-flash"
  );

  useEffect(() => {
    if (propSelectedModel && propSelectedModel !== selectedModel) {
      setSelectedModel(propSelectedModel);
    }
  }, [propSelectedModel]);
  const [syncedToGithub, setSyncedToGithub] = useState(false);
  const [syncingGit, setSyncingGit] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const [appliedCodeKey, setAppliedCodeKey] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  // Quick API Key Modal & Status States
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyModalProvider, setKeyModalProvider] = useState<"gemini" | "groq" | "openrouter">("gemini");
  const [keyModalInput, setKeyModalInput] = useState(getGeminiApiKey());
  const [keyModalStatus, setKeyModalStatus] = useState<string | null>(null);
  const [keyModalLoading, setKeyModalLoading] = useState(false);
  const [showModelSpecsModal, setShowModelSpecsModal] = useState(false);

  const [hasGeminiKey, setHasGeminiKey] = useState(() => Boolean(getGeminiApiKey()));
  const [hasGroqKey, setHasGroqKey] = useState(() => Boolean(getGroqApiKey()));
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(() => Boolean(getOpenRouterApiKey()));
  const hasAnyKey = hasGeminiKey || hasGroqKey || hasOpenRouterKey;

  const handleSaveModalKey = async () => {
    const k = keyModalInput.trim();
    if (!k) {
      setKeyModalStatus("error: Please paste a valid API key");
      return;
    }
    setKeyModalLoading(true);
    setKeyModalStatus(null);
    try {
      if (keyModalProvider === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(k)}`);
        if (res.ok) {
          setGeminiApiKey(k);
          setActiveProvider("gemini");
          setHasGeminiKey(true);
          setKeyModalStatus("success: 🟢 Google Gemini API Connected & Verified!");
          setTimeout(() => setShowKeyModal(false), 1200);
        } else {
          const err = await res.json().catch(() => ({}));
          setKeyModalStatus(`error: ${err.error?.message || "Invalid Google Gemini Key"}`);
        }
      } else if (keyModalProvider === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${k}` },
        });
        if (res.ok) {
          setGroqApiKey(k);
          setActiveProvider("groq");
          setHasGroqKey(true);
          setKeyModalStatus("success: 🟢 Groq LPU Connected & Verified!");
          setTimeout(() => setShowKeyModal(false), 1200);
        } else {
          const err = await res.json().catch(() => ({}));
          setKeyModalStatus(`error: ${err.error?.message || "Invalid Groq Key"}`);
        }
      } else {
        setOpenRouterApiKey(k);
        setActiveProvider("openrouter");
        setHasOpenRouterKey(true);
        setKeyModalStatus("success: 🟢 OpenRouter API Key Saved!");
        setTimeout(() => setShowKeyModal(false), 1200);
      }
    } catch (e: any) {
      setKeyModalStatus(`error: ${e.message || "Network error"}`);
    } finally {
      setKeyModalLoading(false);
    }
  };

  const handleApplyCode = (codeStr: string, key?: string) => {
    if (onApplyCode) {
      onApplyCode(codeStr);
      if (key) {
        setAppliedCodeKey(key);
        setTimeout(() => setAppliedCodeKey(null), 3500);
      }
    }
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smooth 60fps streaming buffer & render loop
  const streamBufferRef = useRef({ text: "", id: "", dirty: false });
  const animFrameRef = useRef<number | null>(null);

  const problemSlug = problem?.slug || "general-dsa";
  const problemTitle = problem?.title || "DSA Practice";
  const codeLinesCount = (code || "").split("\n").length;

  // Jitter-free auto-scroll helper
  const scrollToBottom = (force = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180;
    if (isNearBottom || force) {
      el.scrollTop = el.scrollHeight;
    }
  };

  const startStreamLoop = (targetId: string) => {
    streamBufferRef.current = { text: "", id: targetId, dirty: false };

    const loop = () => {
      if (streamBufferRef.current.dirty) {
        const text = streamBufferRef.current.text;
        const id = streamBufferRef.current.id;
        streamBufferRef.current.dirty = false;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: text, status: "streaming" } : m
          )
        );
        scrollToBottom();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const stopStreamLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Load models on mount
  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      const curr = propSelectedModel || getModelId();
      if (curr && m.some((mod) => mod.id === curr)) {
        setSelectedModel(curr);
      } else {
        const readyModel = m.find((mod) => isModelKeyConfigured(mod));
        const chosen = readyModel ? readyModel.id : (m[0]?.id || "gemini-2.0-flash");
        setSelectedModel(chosen);
        setModelId(chosen);
        onModelChange?.(chosen);
      }
    });
  }, []);

  // Restore chat session when problem changes or on initial mount
  useEffect(() => {
    let isCancelled = false;

    async function loadPastChat() {
      // 1. Try local IndexedDB
      const localSession = await getChatSessionLocal(problemSlug);
      if (localSession && localSession.messages.length > 0 && !isCancelled) {
        setMessages(localSession.messages);
        setSyncedToGithub(!!localSession.synced_to_github);
        setTimeout(() => scrollToBottom(true), 80);
        return;
      }

      // 2. Try fetching from backend /api/chat/{slug}
      try {
        const res = await fetch(`/api/chat/${problemSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.messages && !isCancelled) {
            setMessages(data.messages);
            setSyncedToGithub(true);
            await saveChatSessionLocal(problemSlug, data.messages, problemTitle, true);
            setTimeout(() => scrollToBottom(true), 80);
            return;
          }
        }
      } catch {
        // Backend offline or no saved chat
      }

      if (!isCancelled) {
        setMessages([]);
        setSyncedToGithub(false);
      }
    }

    loadPastChat();

    return () => {
      isCancelled = true;
      stopStreamLoop();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [problemSlug, problemTitle]);

  // Handle model change
  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    setModelId(id);
    onModelChange?.(id);
  };

  // Dynamic contextual suggestions based on problem statement and active code
  const dynamicSuggestions = getDynamicSuggestions(problem, code, language);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!query || isStreaming) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: query,
      timestamp: Date.now(),
    };

    const assistantMessageId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      reasoning: "Thinking and analyzing active editor code...",
      tool_calls: [],
      timestamp: Date.now(),
      status: "thinking",
      model_used: selectedModel,
    };

    const updatedMessages = [...messages, userMessage, initialAssistantMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Keep reasoning collapsed by default (user can tap "Expand" to inspect)
    // setExpandedReasoning stays false by default

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let streamedText = "";
    let streamedReasoning = "";
    const collectedTools: ToolCallItem[] = [];

    // Start 60fps smooth render loop
    startStreamLoop(assistantMessageId);

    try {
      await streamChatMessage({
        slug: problemSlug,
        problem,
        code,
        language,
        messages: updatedMessages.slice(0, -1), // pass previous history
        currentQuery: query,
        modelId: selectedModel,
        abortSignal: abortController.signal,
        onReasoning: (resText) => {
          streamedReasoning = resText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, reasoning: resText, status: "thinking" }
                : m
            )
          );
          scrollToBottom();
        },
        onToolCall: (tool) => {
          collectedTools.push(tool);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, tool_calls: [...collectedTools] }
                : m
            )
          );
          scrollToBottom();
        },
        onDelta: (chunk) => {
          streamedText += chunk;
          streamBufferRef.current.text = streamedText;
          streamBufferRef.current.dirty = true;
        },
        onDone: async (finalContent, finalReasoning, finalTools, modelUsed) => {
          stopStreamLoop();
          const finalMessages = updatedMessages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: finalContent,
                  reasoning: finalReasoning,
                  tool_calls: finalTools,
                  status: "done" as const,
                  model_used: modelUsed,
                }
              : m
          );

          setMessages(finalMessages);
          setIsStreaming(false);
          abortControllerRef.current = null;
          scrollToBottom(true);

          // Save to local storage
          await saveChatSessionLocal(problemSlug, finalMessages, problemTitle, false);
          setSyncedToGithub(false);
        },
        onError: (err) => {
          stopStreamLoop();
          console.error("Streaming chat error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `⚠️ An error occurred while generating response: ${err.message}. Please check your connection or switch models.`,
                    status: "error",
                  }
                : m
            )
          );
          setIsStreaming(false);
          abortControllerRef.current = null;
          scrollToBottom(true);
        },
      });
    } catch (err: any) {
      stopStreamLoop();
      if (!abortController.signal.aborted) {
        setIsStreaming(false);
      }
    }
  };

  // Stop streaming
  const handleStopGenerating = () => {
    stopStreamLoop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Sync to GitHub
  const handleSyncToGitHub = async () => {
    if (messages.length === 0) {
      setSyncNotice("No chat messages to sync yet!");
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    setSyncingGit(true);
    setSyncNotice(null);
    try {
      const res = await syncChatToGitHub(problemSlug, messages, problemTitle);
      setSyncedToGithub(res.pushed);
      setSyncNotice(res.message);
    } catch (e: any) {
      setSyncNotice(`Sync notice: ${e.message}`);
    } finally {
      setSyncingGit(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Clear chat
  const handleClearChat = async () => {
    if (window.confirm("Clear conversation history for this problem?")) {
      await clearChatSessionLocal(problemSlug);
      setMessages([]);
      setSyncedToGithub(false);
    }
  };

  // Copy code snippet
  const handleCopyCode = async (snippet: string, idxKey: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedCodeIdx(idxKey);
      setTimeout(() => setCopiedCodeIdx(null), 2000);
    } catch {}
  };

  // Toggle reasoning collapsible
  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="flex flex-col h-full max-h-full w-full min-h-0 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden shadow-xl relative">
      {/* ─── Chat Header ─── */}
      <div
        className="px-3.5 py-2.5 flex items-center justify-between border-b gap-2 flex-wrap shrink-0"
        style={{
          background: "var(--color-bg-elevated)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        {/* Left: Bot Status & Model */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md">
            <Sparkles size={14} className="text-white" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-900 ${
                isStreaming ? "bg-amber-400 animate-ping" : "bg-emerald-400"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                AI Coding Partner
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Stateless Context
              </span>
            </div>
            <p className="text-[10px] text-muted truncate max-w-[170px] sm:max-w-[220px]">
              {isStreaming ? "Streaming response..." : "Online • English & Hinglish"}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Key Status / Connect Button */}
          {hasAnyKey ? (
            <button
              onClick={() => {
                setKeyModalInput(getGeminiApiKey() || getGroqApiKey() || "");
                setShowKeyModal(true);
              }}
              className="px-2 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
              title="API Key active (Click to view or edit)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">
                {hasGeminiKey ? "Gemini Live" : hasGroqKey ? "Groq Live" : "AI Live"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 shadow-sm animate-pulse"
              title="Click to connect free Google Gemini or Groq API key"
            >
              <Key size={12} />
              <span>Connect Key</span>
            </button>
          )}

          {/* Model Switcher */}
          <div className="flex items-center gap-1">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-gray-200 cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
              title="Active Model & Reasoning Tier"
            >
              <optgroup label="⚡ Fast / Low-Latency Tier (<1.0s)">
                {models
                  .filter((m) => m.tier === "low")
                  .map((m) => {
                    const ready = isModelKeyConfigured(m);
                    return (
                      <option key={m.id} value={m.id}>
                        [Low] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key === "gemini" ? "Gemini" : m.required_key === "groq" ? "Groq" : "Key"}`}
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="🚀 Balanced / Medium Tier (Optimal DSA)">
                {models
                  .filter((m) => m.tier === "medium")
                  .map((m) => {
                    const ready = isModelKeyConfigured(m);
                    return (
                      <option key={m.id} value={m.id}>
                        [Med] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key === "groq" ? "Groq" : m.required_key === "openrouter" ? "OpenRouter" : "Key"}`}
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="🧠 High Reasoning Tier (Hard DP & Proofs)">
                {models
                  .filter((m) => m.tier === "high")
                  .map((m) => {
                    const ready = isModelKeyConfigured(m);
                    return (
                      <option key={m.id} value={m.id}>
                        [High] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key === "gemini" ? "Gemini" : m.required_key === "groq" ? "Groq" : "Key"}`}
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="🛡️ Autonomous Local Engine">
                {models
                  .filter((m) => m.tier === "local")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      [Local] {m.name} • 100% Offline (No Key)
                    </option>
                  ))}
              </optgroup>
            </select>
            <button
              onClick={() => setShowModelSpecsModal(true)}
              className="p-1 rounded-md text-muted hover:text-cyan-400 hover:bg-white/5 cursor-pointer"
              title="View Model Specs, API Key, Free Tier & Token Limits"
            >
              <Info size={13} />
            </button>
          </div>

          {/* Sync / Push to GitHub */}
          <button
            onClick={handleSyncToGitHub}
            disabled={syncingGit || messages.length === 0}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-all border ${
              syncedToGithub
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
            }`}
            title="Save conversation and push to GitHub repository"
          >
            <GitBranch size={12} className={syncingGit ? "animate-spin" : ""} />
            <span className="hidden sm:inline">
              {syncingGit
                ? "Pushing..."
                : syncedToGithub
                ? "GitHub Synced"
                : "Push to GitHub"}
            </span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={() => exportChatAsMarkdown(problemSlug, messages, problemTitle)}
            disabled={messages.length === 0}
            className="p-1 rounded-md text-muted hover:text-white hover:bg-white/5 cursor-pointer"
            title="Export conversation as Markdown file"
          >
            <Download size={13} />
          </button>

          {/* Reset Chat */}
          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="p-1 rounded-md text-muted hover:text-rose-400 hover:bg-white/5 cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Sync Alert Banner */}
      {syncNotice && (
        <div className="px-3 py-1.5 text-[11px] font-medium bg-emerald-950/80 text-emerald-200 border-b border-emerald-800/40 flex items-center justify-between animate-fadeIn">
          <span>{syncNotice}</span>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-xs hover:text-white cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Context Banner */}
      <div
        className="px-3.5 py-1.5 text-[11px] flex items-center justify-between border-b gap-2 text-muted shrink-0"
        style={{
          background: "rgba(15, 23, 42, 0.6)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Terminal size={11} className="text-cyan-400 shrink-0" />
          <span className="text-gray-300 font-mono text-[10px]">
            Attached: {language.toUpperCase()} ({codeLinesCount} lines)
          </span>
          <span className="text-muted">•</span>
          <span className="truncate text-gray-400">
            #{problem?.id} {problemTitle}
          </span>
        </div>
        <span className="text-[10px] text-cyan-400/80 font-mono shrink-0">
          Auto Context
        </span>
      </div>

      {/* Upfront Model Status & API Key Alert Banner */}
      {(() => {
        const curModel = models.find((m) => m.id === selectedModel) || models[0];
        if (!curModel) return null;
        const isReady = isModelKeyConfigured(curModel);

        if (!isReady) {
          return (
            <div className="mx-2 sm:mx-3 mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/40 text-xs shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn shrink-0">
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0 animate-bounce" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 font-bold text-white text-[11px]">
                    <span className="truncate">{curModel.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/50 shrink-0">
                      ⚠️ Needs {curModel.required_key_name || "API Key"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 shrink-0">
                      {curModel.pricing_type || "Free Tier"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-amber-200/90 mt-0.5">
                    <span>Token Limit: <strong>{curModel.token_limit || "128K Ctx"}</strong></span>
                    <span>• Speed: <strong>{curModel.speed || "Fast"}</strong></span>
                    {curModel.best_for && <span className="hidden md:inline">• {curModel.best_for}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                {curModel.key_url && (
                  <a
                    href={curModel.key_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1 transition-all"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                <button
                  onClick={() => {
                    setKeyModalProvider(
                      curModel.required_key === "groq"
                        ? "groq"
                        : curModel.required_key === "openrouter"
                        ? "openrouter"
                        : "gemini"
                    );
                    setShowKeyModal(true);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-400 hover:bg-amber-300 text-black shadow-sm cursor-pointer transition-transform hover:scale-105"
                >
                  Connect Key
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="mx-2 sm:mx-3 mt-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs flex flex-wrap items-center justify-between gap-1 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 text-[11px] min-w-0 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-300 truncate">{curModel.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-mono shrink-0">
                {curModel.pricing_type || "100% Free"}
              </span>
              <span className="text-[10px] text-gray-300 font-mono hidden sm:inline shrink-0">
                • {curModel.token_limit || "128K Ctx"}
              </span>
            </div>
            <button
              onClick={() => setShowModelSpecsModal(true)}
              className="text-[10px] text-muted hover:text-white flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
            >
              <Info size={11} />
              <span>View Specs</span>
            </button>
          </div>
        );
      })()}

      {/* Model Specifications & API Keys Modal */}
      {showModelSpecsModal && (() => {
        const cur = models.find((m) => m.id === selectedModel) || models[0];
        if (!cur) return null;
        const ready = isModelKeyConfigured(cur);
        return (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
            onClick={() => setShowModelSpecsModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border p-4 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--color-border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <Info size={17} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Model Specs & Key Requirements</h3>
                </div>
                <button
                  onClick={() => setShowModelSpecsModal(false)}
                  className="p-1 rounded text-muted hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Model Header Card */}
              <div className="p-3 rounded-xl border space-y-1.5" style={{ background: "var(--color-bg-primary)", borderColor: "var(--color-border-subtle)" }}>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-bold text-sm text-white">{cur.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ready ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {ready ? "🟢 Key Connected & Ready" : `🔴 Missing ${cur.required_key_name || "Key"}`}
                  </span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  {cur.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border-subtle)] space-y-0.5">
                  <span className="text-[10px] text-muted block uppercase font-mono">Required API</span>
                  <span className="font-bold text-white">{cur.required_key_name || "None"}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border-subtle)] space-y-0.5">
                  <span className="text-[10px] text-muted block uppercase font-mono">Pricing & Cost</span>
                  <span className="font-bold text-emerald-400">{cur.pricing_type || "Free Tier"}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border-subtle)] space-y-0.5">
                  <span className="text-[10px] text-muted block uppercase font-mono">Context / Token Limit</span>
                  <span className="font-bold text-cyan-300">{cur.token_limit || (cur.context_length ? `${cur.context_length.toLocaleString()} Tokens` : "128K")}</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-[var(--color-bg-primary)] border-[var(--color-border-subtle)] space-y-0.5">
                  <span className="text-[10px] text-muted block uppercase font-mono">Inference Speed</span>
                  <span className="font-bold text-amber-300">{cur.speed || "Ultra-Fast"}</span>
                </div>
              </div>

              {/* Best For Note */}
              {cur.best_for && (
                <div className="p-2.5 rounded-lg border bg-indigo-950/40 border-indigo-800/40 text-[11px] text-indigo-200">
                  <strong>💡 Best For:</strong> {cur.best_for}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                {cur.key_url ? (
                  <a
                    href={cur.key_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted">No external key required</span>
                )}
                {cur.required_key !== "none" && (
                  <button
                    onClick={() => {
                      setShowModelSpecsModal(false);
                      setKeyModalProvider(
                        cur.required_key === "groq" ? "groq" : cur.required_key === "openrouter" ? "openrouter" : "gemini"
                      );
                      setShowKeyModal(true);
                    }}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-accent text-white hover:opacity-90 cursor-pointer shadow-md transition-transform hover:scale-105"
                  >
                    {ready ? "Edit / Re-verify Key" : "Connect Key Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick API Key Modal */}
      {showKeyModal && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-4 shadow-2xl space-y-3"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: "var(--color-border-subtle)" }}>
              <div className="flex items-center gap-2">
                <Key size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Connect AI Reasoning Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded text-muted hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-secondary leading-relaxed">
              Real-time Google Gemini, Groq LPU, ya OpenRouter models live chalane ke liye free API key enter karein. Sabhi keys aapke local browser me encrypted store hoti hain.
            </p>

            {/* Provider Switch Tabs */}
            <div className="flex rounded-lg border p-0.5 gap-1" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-primary)" }}>
              <button
                onClick={() => {
                  setKeyModalProvider("gemini");
                  setKeyModalInput(getGeminiApiKey());
                  setKeyModalStatus(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  keyModalProvider === "gemini" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-white"
                }`}
              >
                Gemini (Free)
              </button>
              <button
                onClick={() => {
                  setKeyModalProvider("groq");
                  setKeyModalInput(getGroqApiKey());
                  setKeyModalStatus(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  keyModalProvider === "groq" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-white"
                }`}
              >
                Groq LPU (Fast)
              </button>
              <button
                onClick={() => {
                  setKeyModalProvider("openrouter");
                  setKeyModalInput(getOpenRouterApiKey() || getApiKey());
                  setKeyModalStatus(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  keyModalProvider === "openrouter" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-white"
                }`}
              >
                OpenRouter
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted flex items-center justify-between">
                <span>
                  {keyModalProvider === "gemini"
                    ? "Google Gemini API Key (AIzaSy...)"
                    : keyModalProvider === "groq"
                    ? "Groq API Key (gsk_...)"
                    : "OpenRouter API Key (sk-or-v1-...)"}
                </span>
                <a
                  href={
                    keyModalProvider === "gemini"
                      ? "https://aistudio.google.com/app/apikey"
                      : keyModalProvider === "groq"
                      ? "https://console.groq.com/keys"
                      : "https://openrouter.ai/keys"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Get Free Key <ExternalLink size={10} />
                </a>
              </label>
              <input
                type="password"
                value={keyModalInput}
                onChange={(e) => setKeyModalInput(e.target.value)}
                placeholder={
                  keyModalProvider === "gemini"
                    ? "AIzaSy..."
                    : keyModalProvider === "groq"
                    ? "gsk_..."
                    : "sk-or-v1-..."
                }
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono"
                style={{
                  background: "var(--color-bg-primary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {keyModalStatus && (
              <p
                className={`text-[11px] font-semibold ${
                  keyModalStatus.startsWith("success") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {keyModalStatus.replace(/^(success|error):\s*/, "")}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs text-muted hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModalKey}
                disabled={keyModalLoading || !keyModalInput.trim()}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {keyModalLoading ? "Verifying..." : "Verify & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Message Stream Area (ChatGPT-Style Smooth Scroll) ─── */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 chat-scroll-container">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Bot size={24} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-white">
                LeetCode AI Assistant Ready
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Problem context and your active <span className="text-cyan-400 font-semibold">{language.toUpperCase()}</span> code are automatically linked. Ask in English or Hinglish!
              </p>
            </div>

            {/* Dynamic Suggestions Grid */}
            <div className="w-full max-w-md pt-2 space-y-1.5">
              <div className="text-[11px] font-semibold text-gray-400 text-left">
                Suggested questions for {problemTitle}:
              </div>
              <div className="flex flex-col gap-1.5">
                {dynamicSuggestions.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:bg-white/5 hover:border-cyan-500/40 text-gray-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span>{chip.label}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isLatest = idx === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
              >
                {/* Header Tag */}
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted">
                  {isUser ? (
                    <>
                      <span>You</span>
                      <User size={10} />
                    </>
                  ) : (
                    <>
                      <Bot size={10} className="text-cyan-400" />
                      <span className="font-semibold text-cyan-400">
                        LeetCode AI
                      </span>
                      {msg.model_used && (
                        <span className="text-gray-500 font-mono">
                          • {msg.model_used.split("/").pop()}
                        </span>
                      )}
                    </>
                  )}
                  <span>
                    • {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Assistant Reasoning & Tool Calls Box */}
                {!isUser && (msg.reasoning || (msg.tool_calls && msg.tool_calls.length > 0)) && (
                  <div className="w-full max-w-[94%] mb-2 rounded-xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden shadow-md">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Cpu size={13} className="text-cyan-400 animate-pulse" />
                        <span className="text-xs font-semibold text-cyan-300">
                          {msg.status === "thinking"
                            ? "Agent Reasoning & Tool Calls..."
                            : `Reasoned • ${msg.tool_calls?.length || 1} Tools Executed`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-cyan-400">
                        <span>{expandedReasoning[msg.id] ? "Collapse" : "Expand"}</span>
                        {expandedReasoning[msg.id] ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )}
                      </div>
                    </button>

                    {expandedReasoning[msg.id] && (
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-cyan-500/10 text-xs text-gray-300 font-mono">
                        {/* Tool Calls Chips */}
                        {msg.tool_calls && msg.tool_calls.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-sans font-bold">
                              Tools Executed:
                            </div>
                            <div className="space-y-1">
                              {msg.tool_calls.map((tool, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="p-1.5 rounded-lg bg-black/40 border border-cyan-500/15 flex flex-col gap-0.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between text-cyan-300 font-semibold">
                                    <span>⚙️ {tool.label}</span>
                                    <span className="text-[10px] text-emerald-400">✓ done</span>
                                  </div>
                                  {tool.result && (
                                    <span className="text-[10px] text-gray-400 font-sans">
                                      {tool.result}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Thought process logs */}
                        {msg.reasoning && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-sans font-bold">
                              Thought Process:
                            </div>
                            <div className="p-2 rounded-lg bg-black/50 text-[11px] text-cyan-200/90 whitespace-pre-wrap leading-relaxed">
                              {msg.reasoning}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-xs max-w-[94%] leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-md"
                      : "bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-gray-200 rounded-tl-xs shadow-md"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                  ) : (
                    <div className="markdown-body text-xs space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !match;
                            const codeStr = String(children).replace(/\n$/, "");

                            if (isInline) {
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px] border border-white/5"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }

                            const blockLang = match ? match[1] : language;
                            const blockKey = `${msg.id}-${codeStr.slice(0, 15)}`;
                            const isCopied = copiedCodeIdx === blockKey;
                            const isApplied = appliedCodeKey === blockKey;

                            return (
                              <div className="my-2.5 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#0d1117] shadow-xl">
                                {/* Code block header */}
                                <div className="px-3 py-1.5 bg-[#161b22] border-b border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                                      {blockLang}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                      ({codeStr.split("\n").length} lines)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {onApplyCode && (
                                      <button
                                        onClick={() => handleApplyCode(codeStr, blockKey)}
                                        className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
                                          isApplied
                                            ? "bg-emerald-500 text-gray-950 shadow-emerald-500/40 scale-105"
                                            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 hover:scale-105 active:scale-95"
                                        }`}
                                        title="Apply code directly into active Monaco editor"
                                      >
                                        {isApplied ? (
                                          <>
                                            <Check size={11} className="stroke-[3]" />
                                            <span>✓ Applied to Editor!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles size={11} className="fill-current" />
                                            <span>✨ Apply to Editor</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleCopyCode(codeStr, blockKey)}
                                      className="px-2 py-0.5 rounded text-[10px] font-medium hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer flex items-center gap-1 transition-colors"
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check size={11} className="text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={11} />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                                {/* Code block content */}
                                <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-gray-200">
                                  <code>{codeStr}</code>
                                </pre>
                              </div>
                            );
                          },
                        }}
                      >
                        {msg.content || (msg.status === "thinking" ? "*Reasoning and thinking...*" : "")}
                      </ReactMarkdown>

                      {/* Quick Apply Card below assistant message containing code */}
                      {!isUser && msg.content && msg.content.includes("```") && onApplyCode && (
                        <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-black/40 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <Code2 size={13} />
                            </div>
                            <div className="truncate text-[11px]">
                              <span className="font-semibold text-white">Solution ready to test</span>
                              <span className="text-gray-400 hidden sm:inline"> • Click to update editor code</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const codeMatch = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                              if (codeMatch && codeMatch[1]) {
                                handleApplyCode(codeMatch[1].trim(), msg.id);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-md transition-all active:scale-95 ${
                              appliedCodeKey === msg.id
                                ? "bg-emerald-500 text-gray-950"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 hover:opacity-90"
                            }`}
                          >
                            <Sparkles size={12} className="fill-current" />
                            <span>{appliedCodeKey === msg.id ? "✓ Applied!" : "✨ Apply to Editor"}</span>
                          </button>
                        </div>
                      )}

                      {/* Blinking streaming cursor */}
                      {isStreaming && isLatest && msg.role === "assistant" && (
                        <span className="inline-block w-2 h-3.5 bg-cyan-400 ml-1 animate-pulse align-middle rounded-xs" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Bottom Chat Input Area (Pinned like ChatGPT) ─── */}
      <div
        className="p-2.5 sm:p-3 border-t shrink-0 z-10 space-y-2"
        style={{
          background: "var(--color-bg-primary)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        {/* Dynamic Contextual Suggestion Pills (Shown when has messages) */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            {dynamicSuggestions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                disabled={isStreaming}
                className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-cyan-500/40 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-all flex items-center gap-1 whitespace-nowrap shadow-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-end gap-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-2 focus-within:border-cyan-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask AI partner anything (e.g. __builtin_popcount ye kr h bhai)..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 resize-none outline-none leading-relaxed max-h-[120px] px-1"
          />

          {isStreaming ? (
            <button
              onClick={handleStopGenerating}
              className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer transition-colors"
              title="Stop Generating"
            >
              <Square size={14} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
              title="Send Message (Enter)"
            >
              <Send size={14} />
            </button>
          )}
        </div>

        {/* Shortcut and Stateless note */}
        <div className="flex items-center justify-between text-[10px] text-muted px-1">
          <span>Press <strong className="text-gray-400">Enter ↵</strong> to send, <strong className="text-gray-400">Shift + Enter</strong> for newline</span>
          <span className="text-emerald-400/80">
            {syncedToGithub ? "✓ Saved & Synced with GitHub" : "✓ Saved Locally"}
          </span>
        </div>
      </div>
    </div>
  );
};
