import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Play,
  Copy,
  Check,
  Save,
  ExternalLink,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Terminal,
  FileCode,
  Download,
  ZoomIn,
  ZoomOut,
  WrapText,
  RotateCcw,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  LANGUAGES,
  AGENT_STAGES,
  type DailyProblem,
  type AgentStage,
  type SupportedLanguage,
  type AIModel,
} from "../types";
import {
  fetchDailyChallenge,
  runAgentStage,
  fetchModels,
  saveSolution,
  searchWeb,
} from "../services/api";
import {
  getLanguage,
  setLanguage as savePreferredLang,
  getModelId,
  getApiKey,
  addActivity,
  getDraftCode,
  saveDraftCode,
  clearDraftCode,
  getEditorFontSize,
  setEditorFontSize,
  getEditorWordWrap,
  setEditorWordWrap,
} from "../services/storage";
import {
  copyToClipboard,
  navigateToLeetCode,
  detectPlatform,
  getCanonicalLeetCodeUrl,
} from "../services/leetcodeNavigation";
import DifficultyBadge from "../components/UIComponents";
import SubmissionModal from "../components/SubmissionModal";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const passedProblem = (location.state as { problem?: DailyProblem })?.problem;

  const [problem, setProblem] = useState<DailyProblem | null>(passedProblem || null);
  const [loadingProblem, setLoadingProblem] = useState(!passedProblem);
  const [language, setLanguage] = useState<SupportedLanguage>(
    (getLanguage() as SupportedLanguage) || "python"
  );
  const [selectedStage, setSelectedStage] = useState<AgentStage>("generate");
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(getModelId() || "");
  const [isRunning, setIsRunning] = useState(false);

  // Editor states
  const [code, setCode] = useState<string>("");
  const [fontSize, setFontSizeState] = useState<number>(getEditorFontSize());
  const [wordWrap, setWordWrapState] = useState<boolean>(getEditorWordWrap());
  const [useSimpleEditor, setUseSimpleEditor] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Mobile navigation tabs: problem / reasoning / editor / research
  const [mobileTab, setMobileTab] = useState<"problem" | "reasoning" | "editor" | "research">("editor");

  // Stage outputs store history of all stage responses
  const [stageOutputs, setStageOutputs] = useState<Record<string, string>>({});

  // Search query & results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Submission Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(true);
  const [copyError, setCopyError] = useState<string | undefined>();

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const platform = detectPlatform();

  // Load problem on mount
  useEffect(() => {
    if (!problem) {
      fetchDailyChallenge()
        .then((p) => {
          setProblem(p);
          initCodeForProblem(p, language);
        })
        .finally(() => setLoadingProblem(false));
    } else {
      initCodeForProblem(problem, language);
    }

    fetchModels().then((m) => {
      setModels(m);
      if (!selectedModel && m.length > 0) {
        setSelectedModel(m[0].id);
      }
    });
  }, []);

  const initCodeForProblem = (p: DailyProblem, lang: SupportedLanguage) => {
    const draft = getDraftCode(p.slug, lang);
    if (draft && draft.trim()) {
      setCode(draft);
      setHasUnsavedChanges(true);
      return;
    }

    const snippet = p.code_snippets?.[lang];
    if (snippet) {
      setCode(snippet);
    } else {
      const defaultTemplates: Record<SupportedLanguage, string> = {
        python: `# LeetCode Solution: ${p.title}\nclass Solution:\n    def solve(self):\n        pass\n`,
        cpp: `// LeetCode Solution: ${p.title}\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Implement solution\n};\n`,
        java: `// LeetCode Solution: ${p.title}\nclass Solution {\n    // Implement solution\n}\n`,
        javascript: `// LeetCode Solution: ${p.title}\nvar solve = function() {\n    \n};\n`,
        typescript: `// LeetCode Solution: ${p.title}\nfunction solve(): void {\n    \n};\n`,
      };
      setCode(defaultTemplates[lang] || defaultTemplates.python);
    }
    setHasUnsavedChanges(false);
  };

  // Handle editor code change
  const handleCodeChange = (newVal: string) => {
    setCode(newVal);
    setHasUnsavedChanges(true);
    if (problem) {
      saveDraftCode(problem.slug, language, newVal);
    }
  };

  // Language switch with draft warning
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    if (hasUnsavedChanges && !confirm("You have unsaved changes in your code. Switch language anyway?")) {
      return;
    }
    setLanguage(newLang);
    savePreferredLang(newLang);
    if (problem) {
      initCodeForProblem(problem, newLang);
    }
  };

  // Font size adjustment
  const handleFontSize = (delta: number) => {
    const updated = Math.min(22, Math.max(10, fontSize + delta));
    setFontSizeState(updated);
    setEditorFontSize(updated);
  };

  // Word wrap toggle
  const handleToggleWrap = () => {
    const next = !wordWrap;
    setWordWrapState(next);
    setEditorWordWrap(next);
  };

  // Reset to starter template
  const handleResetStarter = () => {
    if (!problem) return;
    if (confirm("Revert code to starter snippet? This will overwrite current edits.")) {
      clearDraftCode(problem.slug, language);
      const snippet = problem.code_snippets?.[language] || "class Solution:\n    pass\n";
      setCode(snippet);
      setHasUnsavedChanges(false);
      showToast("Reverted to starter code");
    }
  };

  // Run single stage
  const handleRunStage = async (stageToRun: AgentStage) => {
    if (!problem) return;
    setIsRunning(true);
    setSelectedStage(stageToRun);

    const apiKey = getApiKey();
    const prevContext = Object.entries(stageOutputs)
      .map(([stg, content]) => `[Stage ${stg}]:\n${content}`)
      .join("\n\n");

    try {
      const response = await runAgentStage({
        problem_slug: problem.slug,
        problem_title: problem.title,
        problem_description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
        language: language,
        stage: stageToRun,
        api_key: apiKey,
        model_id: selectedModel,
        previous_context: prevContext,
      });

      if (response.content) {
        setStageOutputs((prev) => ({
          ...prev,
          [stageToRun]: response.content,
        }));
        setMobileTab("reasoning");
      }

      if (response.code) {
        handleCodeChange(response.code);
      }

      showToast(`Stage "${stageToRun}" complete!`);
      addActivity({
        type: "solve",
        problem_slug: problem.slug,
        problem_title: problem.title,
        language: language,
        timestamp: new Date().toISOString(),
        details: `Ran Agent Stage: ${stageToRun} (${language})`,
      });
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to execute stage"}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run full automated pipeline
  const handleRunFullPipeline = async () => {
    if (!problem || isRunning) return;

    setIsRunning(true);
    showToast("Starting full AI Agent pipeline...");

    const stages: AgentStage[] = ["understand", "plan", "generate", "validate"];
    const accumulatedOutputs: Record<string, string> = { ...stageOutputs };

    for (const stg of stages) {
      setSelectedStage(stg);
      try {
        const apiKey = getApiKey();
        const prevContext = Object.entries(accumulatedOutputs)
          .map(([s, content]) => `[Stage ${s}]:\n${content}`)
          .join("\n\n");

        const response = await runAgentStage({
          problem_slug: problem.slug,
          problem_title: problem.title,
          problem_description: problem.description,
          examples: problem.examples,
          constraints: problem.constraints,
          language: language,
          stage: stg,
          api_key: apiKey,
          model_id: selectedModel,
          previous_context: prevContext,
        });

        if (response.content) {
          accumulatedOutputs[stg] = response.content;
          setStageOutputs((prev) => ({ ...prev, [stg]: response.content }));
        }
        if (response.code) {
          handleCodeChange(response.code);
        }
      } catch (err: any) {
        console.warn(`Stage ${stg} error:`, err);
        // Continue rather than breaking so subsequent stages & code generation still succeed
      }
    }
    setIsRunning(false);
    setMobileTab("editor");
    showToast("✨ AI Solution generated & verified!");
    addActivity({
      type: "solve",
      problem_slug: problem.slug,
      problem_title: problem.title,
      language: language,
      timestamp: new Date().toISOString(),
      details: `Auto-Solved ${problem.title} (${language})`,
    });
  };

  // Primary Action: One-Tap "Copy Solution & Open LeetCode"
  const handleCopyAndOpenLeetCode = async () => {
    if (!code || !code.trim() || code.trim() === "class Solution:\n    pass") {
      showToast("Solution code is empty. Run Auto-Solve first!");
      return;
    }

    const res = await copyToClipboard(code);
    setCopySuccess(res.success);
    setCopyError(res.error);

    if (res.success) {
      showToast("Solution copied to clipboard!");
    }

    // On desktop, try direct tab navigation
    const targetUrl = problem?.url || (problem ? getCanonicalLeetCodeUrl(problem.slug) : "https://leetcode.com");
    if (platform === "desktop") {
      navigateToLeetCode(targetUrl);
    }

    // Always display submission checklist modal with direct button
    setSubmitModalOpen(true);
  };

  // Save solution
  const handleSaveSolution = async () => {
    if (!problem) return;
    try {
      await saveSolution({
        problem_slug: problem.slug,
        problem_title: problem.title,
        language: language,
        code: code,
      });
      setHasUnsavedChanges(false);
      clearDraftCode(problem.slug, language);
      showToast("Solution saved successfully!");
      addActivity({
        type: "save",
        problem_slug: problem.slug,
        problem_title: problem.title,
        language: language,
        timestamp: new Date().toISOString(),
        details: `Saved solution for ${problem.title}`,
      });
    } catch (e: any) {
      showToast(`Failed to save: ${e.message}`);
    }
  };

  // Download solution file
  const handleDownloadCode = () => {
    if (!problem) return;
    const ext = LANGUAGES.find((l) => l.value === language)?.ext || "txt";
    const filename = `${problem.slug}.${ext}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  // Web search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchWeb(searchQuery);
      setSearchResults(res.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];

  return (
    <div className="flex flex-col min-h-[calc(100vh-6.5rem)] gap-3 pb-safe max-w-full overflow-x-hidden">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border animate-bounce backdrop-blur-md"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-accent)",
            color: "var(--color-text-primary)",
          }}
        >
          <Sparkles size={16} style={{ color: "var(--color-accent)" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar: Responsive Flex */}
      <div
        className="card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4"
        style={{ borderRadius: "12px" }}
      >
        {/* Problem Title & Difficulty */}
        <div className="flex items-center gap-2.5 min-w-0">
          {problem && (
            <>
              <DifficultyBadge difficulty={problem.difficulty} />
              <h2
                className="text-sm sm:text-base font-bold truncate text-white"
                title={problem.title}
              >
                {problem.id ? `#${problem.id} ` : ""}
                {problem.title}
              </h2>
              <button
                onClick={() => navigate("/daily")}
                className="hidden sm:flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border text-muted hover:text-white transition-all cursor-pointer shrink-0"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-subtle)",
                }}
                title="Explore Practice Problems by Topic & Difficulty"
              >
                <BookOpen size={12} className="text-accent" />
                <span>Explore Topics</span>
              </button>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer touch-target border"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Model Selector (Hidden on extra small screens) */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="hidden sm:block px-3 py-2 text-xs font-medium rounded-lg cursor-pointer max-w-[180px] truncate border"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id.split("/").pop()} {m.is_free ? "[FREE]" : ""}
              </option>
            ))}
          </select>

          {/* Auto-Solve Full Agent Button */}
          <button
            onClick={handleRunFullPipeline}
            disabled={isRunning || !problem}
            className="px-3.5 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105 disabled:opacity-50 touch-target"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              boxShadow: "0 0 14px var(--color-accent-glow)",
            }}
          >
            <Sparkles size={15} className={isRunning ? "animate-spin" : ""} />
            <span>{isRunning ? "Solving..." : "Auto-Solve"}</span>
          </button>

          {/* One-Tap Copy Solution & Open LeetCode Button */}
          <button
            onClick={handleCopyAndOpenLeetCode}
            className="px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105 touch-target"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              boxShadow: "0 2px 12px rgba(16, 185, 129, 0.3)",
            }}
            title="Copy entire code and open LeetCode submission page"
          >
            <Copy size={14} />
            <span>Copy & Open LeetCode</span>
          </button>
        </div>
      </div>

      {/* Mobile Segmented Tab Selector (< 1024px) */}
      <div
        className="lg:hidden flex items-center rounded-xl p-1 gap-1 border"
        style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border-subtle)" }}
      >
        {(["editor", "problem", "reasoning", "research"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer touch-target text-center"
            style={{
              background: mobileTab === tab ? "var(--color-accent)" : "transparent",
              color: mobileTab === tab ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {tab === "editor" ? "Code" : tab}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout: Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Column (5 cols): Problem / Reasoning / Research */}
        <div
          className={`lg:col-span-5 flex-col card p-0 overflow-hidden h-[500px] lg:h-auto ${
            mobileTab !== "editor" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Desktop Left Tab Bar */}
          <div
            className="hidden lg:flex items-center px-3 pt-2 gap-1 border-b"
            style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-secondary)" }}
          >
            <button
              onClick={() => setMobileTab("problem")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                mobileTab === "problem" ? "border-b-2 text-white" : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: mobileTab === "problem" ? "var(--color-accent)" : "transparent",
                color: mobileTab === "problem" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              Problem Statement
            </button>
            <button
              onClick={() => setMobileTab("reasoning")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                mobileTab === "reasoning" ? "border-b-2 text-white" : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: mobileTab === "reasoning" ? "var(--color-accent)" : "transparent",
                color: mobileTab === "reasoning" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              AI Stages ({Object.keys(stageOutputs).length})
            </button>
            <button
              onClick={() => setMobileTab("research")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                mobileTab === "research" ? "border-b-2 text-white" : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: mobileTab === "research" ? "var(--color-accent)" : "transparent",
                color: mobileTab === "research" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              Web Research
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. Problem Description */}
            {(mobileTab === "problem" || (mobileTab === "editor" && typeof window !== "undefined" && window.innerWidth >= 1024)) && problem && (
              <div className="space-y-4 text-xs">
                <div
                  className="problem-description text-xs"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />

                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="font-semibold text-xs text-white">Examples:</div>
                    {problem.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg font-mono text-[11px] space-y-1.5"
                        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border-subtle)" }}
                      >
                        <div>
                          <strong style={{ color: "var(--color-text-muted)" }}>Input: </strong>
                          <span style={{ color: "var(--color-text-primary)" }}>{ex.input}</span>
                        </div>
                        <div>
                          <strong style={{ color: "var(--color-text-muted)" }}>Output: </strong>
                          <span style={{ color: "var(--color-success)" }}>{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="font-sans text-xs pt-1" style={{ color: "var(--color-text-secondary)" }}>
                            <strong>Explanation: </strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="font-semibold text-xs text-white">Constraints:</div>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                      {problem.constraints.map((c, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: c }} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 2. AI Reasoning & Stages */}
            {mobileTab === "reasoning" && (
              <div className="space-y-3">
                {/* Stage chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {AGENT_STAGES.map((stg) => {
                    const hasOutput = !!stageOutputs[stg.key];
                    const isSelected = selectedStage === stg.key;
                    return (
                      <button
                        key={stg.key}
                        onClick={() => handleRunStage(stg.key)}
                        disabled={isRunning}
                        className="p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border flex flex-col gap-0.5 touch-target"
                        style={{
                          background: isSelected ? "var(--color-accent-glow)" : "var(--color-bg-elevated)",
                          borderColor: isSelected ? "var(--color-accent)" : "var(--color-border-subtle)",
                        }}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{stg.icon} {stg.label}</span>
                          {hasOutput && <Check size={12} style={{ color: "var(--color-success)" }} />}
                        </div>
                        <span className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>
                          {stg.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stage Markdown Output */}
                <div
                  className="p-3.5 rounded-xl text-xs font-mono overflow-x-auto markdown-body"
                  style={{
                    background: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border-subtle)",
                    minHeight: "240px",
                  }}
                >
                  {stageOutputs[selectedStage] ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {stageOutputs[selectedStage]}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-12 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Tap any stage above to run deep algorithmic reasoning for <strong>{selectedStage}</strong>.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Research Tab */}
            {mobileTab === "research" && (
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search algorithm or topic (e.g. Monotonic Stack)..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border outline-none touch-target"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer touch-target"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    <Search size={14} className={searching ? "animate-spin" : ""} />
                    Search
                  </button>
                </form>

                {searchResults.length > 0 ? (
                  <div className="space-y-2.5">
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border space-y-1.5"
                        style={{
                          background: "var(--color-bg-primary)",
                          borderColor: "var(--color-border-subtle)",
                        }}
                      >
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-xs flex items-center gap-1.5 hover:underline"
                          style={{ color: "var(--color-accent)" }}
                        >
                          <BookOpen size={13} />
                          {res.title}
                          <ExternalLink size={10} />
                        </a>
                        <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
                          {res.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Search algorithm patterns, editorials, and complexity analysis.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Code Editor with Mobile Optimization */}
        <div
          className={`lg:col-span-7 flex flex-col card p-0 overflow-hidden min-h-[420px] lg:min-h-0 h-full ${
            mobileTab === "editor" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Editor Action Header */}
          <div
            className="flex flex-wrap items-center justify-between px-3 py-2 border-b gap-2"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileCode size={14} style={{ color: "var(--color-accent)" }} />
              <span className="text-xs font-semibold text-white">
                {currentLangObj.label} Solution
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] text-amber-400 font-mono">• (Draft)</span>
              )}
            </div>

            {/* Mobile & Desktop View Controls */}
            <div className="flex items-center gap-1.5">
              {/* Font Size controls */}
              <button
                onClick={() => handleFontSize(-1)}
                className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center text-xs"
                title="Decrease Font Size"
              >
                <ZoomOut size={13} />
              </button>
              <button
                onClick={() => handleFontSize(1)}
                className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center text-xs"
                title="Increase Font Size"
              >
                <ZoomIn size={13} />
              </button>

              {/* Word wrap toggle */}
              <button
                onClick={handleToggleWrap}
                className="p-1.5 rounded hover:bg-white/10 cursor-pointer touch-target flex items-center justify-center text-xs"
                style={{ color: wordWrap ? "var(--color-accent)" : "var(--color-text-muted)" }}
                title="Toggle Word Wrap"
              >
                <WrapText size={13} />
              </button>

              {/* Reset to starter snippet */}
              <button
                onClick={handleResetStarter}
                className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center text-xs"
                title="Reset to Starter Template"
              >
                <RotateCcw size={13} />
              </button>

              {/* Download */}
              <button
                onClick={handleDownloadCode}
                className="p-1.5 rounded hover:bg-white/10 text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center text-xs"
                title="Export File"
              >
                <Download size={13} />
              </button>

              {/* Save Button */}
              <button
                onClick={handleSaveSolution}
                className="px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 cursor-pointer touch-target border"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <Save size={13} />
                Save
              </button>
            </div>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 w-full min-h-[350px] lg:min-h-0 relative">
            {!useSimpleEditor ? (
              <Editor
                height="100%"
                language={currentLangObj.monacoLang}
                value={code}
                theme="vs-dark"
                onChange={(val) => handleCodeChange(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  fontFamily: "var(--font-mono)",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: wordWrap ? "on" : "off",
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            ) : (
              /* Accessible Textarea Editor Fallback for Mobile */
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-full p-3 font-mono text-xs bg-transparent text-gray-200 outline-none resize-none leading-relaxed"
                style={{ fontSize: `${fontSize}px`, whiteSpace: wordWrap ? "pre-wrap" : "pre" }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Action Bar on Small Screens */}
      <div
        className="lg:hidden fixed bottom-16 left-0 right-0 z-30 p-2.5 border-t backdrop-blur-md flex items-center gap-2"
        style={{
          background: "rgba(22, 24, 34, 0.94)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <button
          onClick={handleRunFullPipeline}
          disabled={isRunning || !problem}
          className="flex-1 py-3 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-white cursor-pointer touch-target shadow-lg disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}
        >
          <Sparkles size={15} className={isRunning ? "animate-spin" : ""} />
          <span>{isRunning ? "Solving..." : "Auto-Solve"}</span>
        </button>

        <button
          onClick={handleCopyAndOpenLeetCode}
          className="flex-1 py-3 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-white cursor-pointer touch-target shadow-lg"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <Copy size={15} />
          <span>Copy & Submit</span>
        </button>
      </div>

      {/* Submission Guidance Modal */}
      <SubmissionModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        problemSlug={problem?.slug || ""}
        problemTitle={problem?.title || "Problem"}
        problemUrl={problem?.url}
        language={currentLangObj.label}
        code={code}
        copySuccess={copySuccess}
        copyError={copyError}
      />
    </div>
  );
}
