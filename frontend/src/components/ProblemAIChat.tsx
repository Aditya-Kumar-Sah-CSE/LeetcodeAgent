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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { DailyProblem, ChatMessage, ToolCallItem, SupportedLanguage, AIModel } from "../types";
import {
  streamChatMessage,
  syncChatToGitHub,
  exportChatAsMarkdown,
} from "../services/chatService";
import {
  getChatSessionLocal,
  saveChatSessionLocal,
  clearChatSessionLocal,
  getModelId,
  setModelId,
} from "../services/storage";
import { fetchModels } from "../services/api";

interface ProblemAIChatProps {
  problem: DailyProblem | null;
  code: string;
  language: SupportedLanguage;
  onApplyCode?: (newCode: string) => void;
}

export const ProblemAIChat: React.FC<ProblemAIChatProps> = ({
  problem,
  code,
  language,
  onApplyCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(getModelId() || "openrouter/free");
  const [syncedToGithub, setSyncedToGithub] = useState(false);
  const [syncingGit, setSyncingGit] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const problemSlug = problem?.slug || "general-dsa";
  const problemTitle = problem?.title || "DSA Practice";
  const codeLinesCount = (code || "").split("\n").length;

  // Load models on mount
  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      if (!selectedModel && m.length > 0) {
        setSelectedModel(m[0].id);
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [problemSlug, problemTitle]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle model change
  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    setModelId(id);
  };

  // Quick prompt suggestions
  const suggestionChips = [
    { label: "💡 Explain __builtin_popcount", query: "__builtin_popcount ye kr h bhai samjha do" },
    { label: "🐛 Check Division by Zero", query: "Bhai kya mere code me s2 / s1 se division by zero ka error aayega agar s1 == 0 ho?" },
    { label: "🇮🇳 Explain in Hinglish", query: "Bhai mere active code ko Hindi / Hinglish me line by line samjha do" },
    { label: "⚡ Optimize Complexity", query: "Kya is code ki time aur space complexity optimal hai? Improve karo." },
    { label: "🧪 Dry Run on Example 1", query: "Aapke inputs ke sath Example 1 ka step-by-step dry run dikhao" },
  ];

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

    // Auto-expand reasoning for the new message
    setExpandedReasoning((prev) => ({ ...prev, [assistantMessageId]: true }));

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let streamedText = "";
    let streamedReasoning = "";
    const collectedTools: ToolCallItem[] = [];

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
        },
        onDelta: (chunk) => {
          streamedText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: streamedText,
                    status: "streaming",
                  }
                : m
            )
          );
        },
        onDone: async (finalContent, finalReasoning, finalTools, modelUsed) => {
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

          // Save to local storage
          await saveChatSessionLocal(problemSlug, finalMessages, problemTitle, false);
          setSyncedToGithub(false);
        },
        onError: (err) => {
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
        },
      });
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        setIsStreaming(false);
      }
    }
  };

  // Stop streaming
  const handleStopGenerating = () => {
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
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] overflow-hidden shadow-xl">
      {/* ─── Chat Header ─── */}
      <div
        className="px-3.5 py-2.5 flex items-center justify-between border-b gap-2 flex-wrap"
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
          {/* Model Switcher */}
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-gray-200 cursor-pointer max-w-[130px] truncate"
            title="Active LLM Model"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id.split("/").pop()}
              </option>
            ))}
          </select>

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
        className="px-3.5 py-1.5 text-[11px] flex items-center justify-between border-b gap-2 text-muted"
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

      {/* ─── Message Stream Area ─── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
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

            {/* Quick Suggestions Grid */}
            <div className="w-full max-w-md pt-2 space-y-1.5">
              <div className="text-[11px] font-semibold text-gray-400 text-left">
                Suggested questions:
              </div>
              <div className="flex flex-col gap-1.5">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:bg-white/5 hover:border-cyan-500/40 text-gray-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span>{chip.label}</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
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

                            return (
                              <div className="my-2 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[#0d1117] shadow-lg">
                                {/* Code block header */}
                                <div className="px-3 py-1.5 bg-[#161b22] border-b border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
                                  <span className="font-mono text-cyan-400 font-semibold uppercase">
                                    {blockLang}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {onApplyCode && (
                                      <button
                                        onClick={() => onApplyCode(codeStr)}
                                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer flex items-center gap-1 transition-colors"
                                        title="Apply code directly into active editor"
                                      >
                                        <Code2 size={11} />
                                        <span>Apply to Editor</span>
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

      {/* ─── Bottom Chat Input Area ─── */}
      <div
        className="p-3 border-t space-y-2"
        style={{
          background: "var(--color-bg-primary)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        {/* Quick Suggestion Pills (Shown when has messages) */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => handleSendMessage("__builtin_popcount kya karta hai bhai? Explain karo.")}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-cyan-500/40 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-all"
            >
              💡 Explain __builtin_popcount
            </button>
            <button
              onClick={() => handleSendMessage("Bhai mere code me koi division by zero ya edge case bug hai kya?")}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-cyan-500/40 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-all"
            >
              🐛 Check Bug in Code
            </button>
            <button
              onClick={() => handleSendMessage("Hinglish me step-by-step intuition explain karo")}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-cyan-500/40 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-all"
            >
              🇮🇳 Hinglish Explanation
            </button>
            <button
              onClick={() => handleSendMessage("Is logic ki exact time complexity aur space complexity kya hai?")}
              disabled={isStreaming}
              className="px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-cyan-500/40 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-all"
            >
              ⚡ Time/Space Complexity
            </button>
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
