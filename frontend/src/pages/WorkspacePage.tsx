import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
} from "../services/storage";
import DifficultyBadge, { StatusDot } from "../components/UIComponents";

export default function WorkspacePage() {
  const location = useLocation();
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
  const [code, setCode] = useState<string>(
    passedProblem?.code_snippets?.[language] ||
      `# Optimal Solution for ${passedProblem?.title || "Problem"}\nclass Solution:\n    def solve(self):\n        pass\n`
  );

  // Stage outputs store history of all stage responses
  const [stageOutputs, setStageOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"editor" | "stage-output" | "research">("editor");

  // Search query & results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Status & notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // If no problem was passed, fetch the daily challenge
    if (!problem) {
      fetchDailyChallenge()
        .then((p) => {
          setProblem(p);
          const snippet = p.code_snippets?.[language];
          if (snippet) setCode(snippet);
        })
        .finally(() => setLoadingProblem(false));
    }

    // Load available models
    fetchModels().then((m) => {
      setModels(m);
      if (!selectedModel && m.length > 0) {
        setSelectedModel(m[0].id);
      }
    });
  }, []);

  // Update starter code when language changes
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    savePreferredLang(newLang);
    if (problem?.code_snippets?.[newLang]) {
      setCode(problem.code_snippets[newLang]);
    }
  };

  // Run the selected AI Agent stage
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
        setActiveTab("stage-output");
      }

      if (response.code) {
        setCode(response.code);
      }

      showToast(`Stage "${stageToRun}" completed!`);
      addActivity({
        type: "solve",
        problem_slug: problem.slug,
        problem_title: problem.title,
        language: language,
        timestamp: new Date().toISOString(),
        details: `Ran Agent Stage: ${stageToRun} (${language})`,
      });
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to execute agent"}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run full pipeline sequentially
  const handleRunFullPipeline = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    showToast("Starting full AI Agent pipeline...");

    const stages: AgentStage[] = ["understand", "plan", "generate", "validate"];
    for (const stg of stages) {
      setSelectedStage(stg);
      try {
        const apiKey = getApiKey();
        const prevContext = Object.entries(stageOutputs)
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
          setStageOutputs((prev) => ({ ...prev, [stg]: response.content }));
        }
        if (response.code) {
          setCode(response.code);
        }
      } catch (err: any) {
        showToast(`Failed at stage ${stg}: ${err.message}`);
        break;
      }
    }
    setIsRunning(false);
    setActiveTab("editor");
    showToast("Full pipeline execution completed!");
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard!");
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

  // Download code file
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

  // Search algorithm
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
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-3">
      {/* Toast banner */}
      {toastMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-bounce"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-accent)",
            color: "var(--color-text-primary)",
          }}
        >
          <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
          {toastMessage}
        </div>
      )}

      {/* Top Bar: Problem Title, Language, Model, Run Pipeline */}
      <div
        className="card flex flex-wrap items-center justify-between gap-3 py-2.5 px-4"
        style={{ borderRadius: "8px" }}
      >
        <div className="flex items-center gap-3">
          {problem && (
            <>
              <DifficultyBadge difficulty={problem.difficulty} />
              <h2
                className="text-base font-bold truncate max-w-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                {problem.id ? `#${problem.id} ` : ""}
                {problem.title}
              </h2>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer max-w-[200px] truncate"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id.split("/").pop()} {m.is_free ? "(Free)" : ""}
              </option>
            ))}
          </select>

          {/* Full Pipeline Button */}
          <button
            onClick={handleRunFullPipeline}
            disabled={isRunning || !problem}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              boxShadow: "0 0 12px var(--color-accent-glow)",
            }}
          >
            <Sparkles size={14} className={isRunning ? "animate-spin" : ""} />
            {isRunning ? "Agent Running..." : "Auto-Solve (Full Agent)"}
          </button>

          {/* Submit Guide Trigger */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            style={{
              background: "rgba(52, 211, 153, 0.15)",
              color: "var(--color-success)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
            }}
          >
            <ExternalLink size={13} />
            Submit to LeetCode
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Problem/Stages/Research, Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Column (5 cols): Tabs for Problem / Stage Output / Research */}
        <div className="lg:col-span-5 flex flex-col card p-0 overflow-hidden h-full">
          {/* Tabs bar */}
          <div
            className="flex items-center px-3 pt-2 gap-1 border-b"
            style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-secondary)" }}
          >
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === "editor"
                  ? "border-b-2 text-white"
                  : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: activeTab === "editor" ? "var(--color-accent)" : "transparent",
                color: activeTab === "editor" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              Problem Statement
            </button>
            <button
              onClick={() => setActiveTab("stage-output")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === "stage-output"
                  ? "border-b-2 text-white"
                  : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: activeTab === "stage-output" ? "var(--color-accent)" : "transparent",
                color: activeTab === "stage-output" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              Agent Stages & Analysis {Object.keys(stageOutputs).length > 0 && `(${Object.keys(stageOutputs).length})`}
            </button>
            <button
              onClick={() => setActiveTab("research")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === "research"
                  ? "border-b-2 text-white"
                  : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: activeTab === "research" ? "var(--color-accent)" : "transparent",
                color: activeTab === "research" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              Web Research
            </button>
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "editor" && problem && (
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
                        className="p-2.5 rounded font-mono text-[11px] space-y-1"
                        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-border-subtle)" }}
                      >
                        <div><strong style={{ color: "var(--color-text-muted)" }}>Input:</strong> {ex.input}</div>
                        <div><strong style={{ color: "var(--color-text-muted)" }}>Output:</strong> <span style={{ color: "var(--color-success)" }}>{ex.output}</span></div>
                        {ex.explanation && <div><strong style={{ color: "var(--color-text-muted)" }}>Note:</strong> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-1 pt-2">
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

            {activeTab === "stage-output" && (
              <div className="space-y-4">
                {/* Stage selector chips */}
                <div className="grid grid-cols-3 gap-1.5">
                  {AGENT_STAGES.map((stg) => {
                    const hasOutput = !!stageOutputs[stg.key];
                    const isSelected = selectedStage === stg.key;
                    return (
                      <button
                        key={stg.key}
                        onClick={() => handleRunStage(stg.key)}
                        disabled={isRunning}
                        className="p-2 rounded-lg text-left text-xs transition-all cursor-pointer border flex flex-col gap-0.5"
                        style={{
                          background: isSelected
                            ? "var(--color-accent-glow)"
                            : "var(--color-bg-elevated)",
                          borderColor: isSelected
                            ? "var(--color-accent)"
                            : "var(--color-border-subtle)",
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

                {/* Display output for selected stage or latest */}
                <div
                  className="p-3.5 rounded-lg text-xs font-mono overflow-x-auto markdown-body"
                  style={{
                    background: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border-subtle)",
                    minHeight: "220px",
                  }}
                >
                  {stageOutputs[selectedStage] ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {stageOutputs[selectedStage]}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
                      Click any stage above or "Auto-Solve" to generate algorithmic insights for {selectedStage}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "research" && (
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search algorithm or topic (e.g. Monotonic Stack)..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border outline-none"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
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
                  <div className="text-center py-8 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Search LeetCode patterns, editorials, or time complexity guides.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Monaco Code Editor & Control Actions */}
        <div className="lg:col-span-7 flex flex-col card p-0 overflow-hidden h-full">
          {/* Editor Header Bar */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileCode size={14} style={{ color: "var(--color-accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Solution Code ({currentLangObj.label})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Copy Code"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Copy size={13} />
                Copy
              </button>
              <button
                onClick={handleDownloadCode}
                className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Download Solution"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Download size={13} />
                Export
              </button>
              <button
                onClick={handleSaveSolution}
                className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Save size={13} />
                Save
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full min-h-0">
            <Editor
              height="100%"
              language={currentLangObj.monacoLang}
              value={code}
              theme="vs-dark"
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                renderLineHighlight: "all",
                cursorSmoothCaretAnimation: "on",
              }}
            />
          </div>
        </div>
      </div>

      {/* Manual LeetCode Submit Modal / Guide */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="card max-w-lg w-full space-y-4"
            style={{ background: "var(--color-bg-card)", borderColor: "var(--color-accent)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} style={{ color: "var(--color-success)" }} />
                <h3 className="font-bold text-base text-white">Manual LeetCode Submission</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-xs text-muted hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              LeetCode requires manual submission for account security (avoiding automated submission CAPTCHAs and cookie expiration). Follow these 3 quick steps:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg flex items-start gap-3" style={{ background: "var(--color-bg-elevated)" }}>
                <span className="font-bold text-accent">1.</span>
                <div className="flex-1">
                  <strong>Copy Your Code:</strong> We have formatted and validated your {currentLangObj.label} solution.
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-accent text-white cursor-pointer hover:opacity-90"
                >
                  Copy Now
                </button>
              </div>

              <div className="p-3 rounded-lg flex items-start gap-3" style={{ background: "var(--color-bg-elevated)" }}>
                <span className="font-bold text-accent">2.</span>
                <div className="flex-1">
                  <strong>Open LeetCode:</strong> Navigate directly to the submission editor.
                </div>
                {problem && (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-success/20 text-success border border-success/30 flex items-center gap-1 cursor-pointer"
                  >
                    Open <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <div className="p-3 rounded-lg flex items-start gap-3" style={{ background: "var(--color-bg-elevated)" }}>
                <span className="font-bold text-accent">3.</span>
                <div className="flex-1">
                  <strong>Paste & Submit:</strong> Select {currentLangObj.label} on LeetCode, paste, and click <em>"Submit"</em>!
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
