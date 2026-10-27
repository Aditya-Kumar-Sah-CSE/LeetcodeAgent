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
  Code2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Columns,
  Sliders,
  Link,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
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
  type TestCaseItem,
  type RunCodeResponse,
  type SingleTestResult,
} from "../types";
import {
  fetchDailyChallenge,
  fetchProblem,
  extractProblemSlug,
  runAgentStage,
  fetchModels,
  saveSolution,
  searchWeb,
  runCode,
} from "../services/api";
import {
  getLanguage,
  setLanguage as savePreferredLang,
  getModelId,
  setModelId,
  isModelKeyConfigured,
  getApiKey,
  addActivity,
  getDraftCode,
  saveDraftCode,
  clearDraftCode,
  getEditorFontSize,
  setEditorFontSize,
  getEditorWordWrap,
  setEditorWordWrap,
  isProblemSolved,
  toggleProblemSolved,
  setProblemSolved,
  getActiveWorkspaceProblem,
  setActiveWorkspaceProblem,
  getUiDensity,
  setUiDensity,
  type UiDensity,
} from "../services/storage";
import {
  copyToClipboard,
  navigateToLeetCode,
  detectPlatform,
  getCanonicalLeetCodeUrl,
} from "../services/leetcodeNavigation";
import DifficultyBadge, { ProblemStatusBadge } from "../components/UIComponents";
import SubmissionModal from "../components/SubmissionModal";
import { ProblemAIChat } from "../components/ProblemAIChat";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const slugFromUrl = searchParams.get("slug");

  const passedProblem = (location.state as { problem?: DailyProblem })?.problem;
  const cachedProblem = !passedProblem ? getActiveWorkspaceProblem() : null;

  const initialProblem =
    passedProblem ||
    (cachedProblem && (!slugFromUrl || cachedProblem.slug === slugFromUrl) ? cachedProblem : null);

  const [problem, setProblem] = useState<DailyProblem | null>(initialProblem);
  const [loadingProblem, setLoadingProblem] = useState(!initialProblem);
  const [language, setLanguage] = useState<SupportedLanguage>(
    (getLanguage() as SupportedLanguage) || "python"
  );
  const [selectedStage, setSelectedStage] = useState<AgentStage>("generate");
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(getModelId() || "gemini-3-flash-preview");
  const [isRunning, setIsRunning] = useState(false);

  // Editor states
  const [code, setCode] = useState<string>("");
  const [fontSize, setFontSizeState] = useState<number>(getEditorFontSize());
  const [wordWrap, setWordWrapState] = useState<boolean>(getEditorWordWrap());
  const [useSimpleEditor, setUseSimpleEditor] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Test runner & console states
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [customTestCases, setCustomTestCases] = useState<TestCaseItem[]>([]);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);


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

  // Fetch Problem by URL or Contest Link Modal state
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customProblemUrl, setCustomProblemUrl] = useState("");
  const [fetchingCustomProblem, setFetchingCustomProblem] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState("");

  const handleFetchProblemByUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = customProblemUrl.trim();
    if (!input) return;
    setFetchingCustomProblem(true);
    setUrlFetchError("");
    try {
      const p = await fetchProblem(input);
      setProblem(p);
      setActiveWorkspaceProblem(p);
      setIsSolved(isProblemSolved(p.slug));
      initCodeForProblem(p, language);
      setShowUrlModal(false);
      setCustomProblemUrl("");
      showToast(`Loaded "${p.title}" #${p.id || p.slug}`);
      navigate(`/workspace?slug=${encodeURIComponent(p.slug)}`, { replace: true, state: { problem: p } });
    } catch (err: any) {
      setUrlFetchError(err.message || "Failed to fetch problem from LeetCode. Verify URL or network.");
    } finally {
      setFetchingCustomProblem(false);
    }
  };

  // Problem solved status tracking
  const [isSolved, setIsSolved] = useState<boolean>(() =>
    passedProblem?.slug ? isProblemSolved(passedProblem.slug) : false
  );

  // Resizable split ratio between left pane (AI / Chat) and right pane (Editor)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("lca-workspace-split-ratio");
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 25 && val <= 75) return val;
      }
    } catch {}
    return 50; // default 50% split (wider chat window than the previous 41.6%)
  });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    try {
      editor.layout();
    } catch {}
  };

  // Keep editor layout responsive to panel resizing and tab switching
  useEffect(() => {
    if (editorRef.current) {
      const timer = setTimeout(() => {
        try {
          editorRef.current?.layout();
        } catch {}
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [splitRatio, isDesktop, mobileTab]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [uiDensityState, setUiDensityState] = useState<UiDensity>(() => getUiDensity());

  const handleCycleUiDensity = () => {
    const order: UiDensity[] = ["compact", "medium", "standard"];
    const currIdx = order.indexOf(uiDensityState);
    const next = order[(currIdx + 1) % order.length];
    setUiDensity(next);
    setUiDensityState(next);
    showToast(
      `Display Scale: ${
        next === "compact" ? "75% Sleek (Compact IDE)" : next === "medium" ? "88% Balanced" : "100% Standard"
      }`
    );
  };

  const handleUpdateSplitRatio = (newRatio: number) => {
    const clamped = Math.min(80, Math.max(20, Math.round(newRatio)));
    setSplitRatio(clamped);
    try {
      localStorage.setItem("lca-workspace-split-ratio", clamped.toString());
    } catch {}
    if (editorRef.current) {
      try {
        editorRef.current.layout();
      } catch {}
    }
  };

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleSplitPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSplit || !workspaceContainerRef.current) return;
    const rect = workspaceContainerRef.current.getBoundingClientRect();
    const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
    handleUpdateSplitRatio(rawPercent);
  };

  const handleSplitPointerUp = (e: React.PointerEvent) => {
    setIsDraggingSplit(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceContainerRef.current) return;
      const rect = workspaceContainerRef.current.getBoundingClientRect();
      const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
      handleUpdateSplitRatio(rawPercent);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    if (problem) {
      setActiveWorkspaceProblem(problem);
      setIsSolved(isProblemSolved(problem.slug));
      // Keep URL slug synced for bookmarks and direct browser reloads
      const currentParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      if (currentParams.get("slug") !== problem.slug) {
        navigate(`/workspace?slug=${encodeURIComponent(problem.slug)}`, {
          replace: true,
          state: { problem },
        });
      }
    }
  }, [problem?.slug]);

  const handleToggleSolved = () => {
    if (!problem?.slug) return;
    const nowSolved = toggleProblemSolved(problem.slug);
    setIsSolved(nowSolved);
    showToast(nowSolved ? `Marked "${problem.title}" as Solved ✓` : `Marked "${problem.title}" as New ★`);
  };

  // Load problem on mount
  useEffect(() => {
    if (!problem) {
      const slugToLoad =
        slugFromUrl ||
        new URLSearchParams(window.location.hash.split("?")[1] || "").get("slug") ||
        cachedProblem?.slug;
      if (slugToLoad) {
        fetchProblem(slugToLoad)
          .then((p) => {
            setProblem(p);
            setIsSolved(isProblemSolved(p.slug));
            initCodeForProblem(p, language);
          })
          .catch(() => {
            fetchDailyChallenge().then((p) => {
              setProblem(p);
              setIsSolved(isProblemSolved(p.slug));
              initCodeForProblem(p, language);
            });
          })
          .finally(() => setLoadingProblem(false));
      } else {
        fetchDailyChallenge()
          .then((p) => {
            setProblem(p);
            setIsSolved(isProblemSolved(p.slug));
            initCodeForProblem(p, language);
          })
          .finally(() => setLoadingProblem(false));
      }
    } else {
      initCodeForProblem(problem, language);
    }

    fetchModels().then((m) => {
      setModels(m);
      const savedModel = getModelId();
      if (savedModel && m.some((mod) => mod.id === savedModel)) {
        setSelectedModel(savedModel);
      } else {
        const readyModel = m.find((mod) => isModelKeyConfigured(mod));
        const chosen = readyModel ? readyModel.id : (m[0]?.id || "gemini-2.0-flash");
        setSelectedModel(chosen);
        setModelId(chosen);
      }
    });
  }, []);

  // Reactive problem loading whenever URL slug changes
  useEffect(() => {
    const currentSlug =
      slugFromUrl ||
      new URLSearchParams(window.location.hash.split("?")[1] || "").get("slug");
    if (currentSlug && (!problem || problem.slug !== currentSlug)) {
      setLoadingProblem(true);
      fetchProblem(currentSlug)
        .then((p) => {
          setProblem(p);
          setIsSolved(isProblemSolved(p.slug));
          initCodeForProblem(p, language);
        })
        .catch(() => {
          fetchDailyChallenge().then((p) => {
            setProblem(p);
            setIsSolved(isProblemSolved(p.slug));
            initCodeForProblem(p, language);
          });
        })
        .finally(() => setLoadingProblem(false));
    }
  }, [slugFromUrl, location.search, location.hash]);

  // Safety guard: ensure starter code is never left blank if problem is loaded
  useEffect(() => {
    if (problem && (!code || !code.trim())) {
      initCodeForProblem(problem, language);
    }
  }, [problem?.slug, language]);

  const initCodeForProblem = (p: DailyProblem, lang: SupportedLanguage) => {
    const draft = getDraftCode(p.slug, lang);
    if (draft && draft.trim()) {
      setCode(draft);
      setHasUnsavedChanges(true);
      return;
    }

    const snippet = p.code_snippets?.[lang];
    if (snippet && snippet.trim()) {
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
    if (code && code.trim()) {
      if (!confirm("Revert code to official starter template? This will replace your current edits.")) {
        return;
      }
    }
    clearDraftCode(problem.slug, language);
    const snippet = problem.code_snippets?.[language];
    if (snippet && snippet.trim()) {
      setCode(snippet);
    } else {
      const defaultTemplates: Record<SupportedLanguage, string> = {
        python: `# LeetCode Solution: ${problem.title}\nclass Solution:\n    def solve(self):\n        pass\n`,
        cpp: `// LeetCode Solution: ${problem.title}\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Implement solution\n};\n`,
        java: `// LeetCode Solution: ${problem.title}\nclass Solution {\n    // Implement solution\n}\n`,
        javascript: `// LeetCode Solution: ${problem.title}\nvar solve = function() {\n    \n};\n`,
        typescript: `// LeetCode Solution: ${problem.title}\nfunction solve(): void {\n    \n};\n`,
      };
      setCode(defaultTemplates[language] || defaultTemplates.python);
    }
    setHasUnsavedChanges(false);
    showToast("Reverted code to official starter template ✓");
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

      let codeToApply = response.code;
      if (!codeToApply && response.content && (stageToRun === "generate" || stageToRun === "explain")) {
        const match = response.content.match(/```(?:[a-zA-Z0-9_#+-]+)?\s*\n([\s\S]*?)```/);
        if (match) {
          codeToApply = match[1].trim();
        }
      }
      if (codeToApply && (stageToRun === "generate" || !code || code.includes("// Implement solution") || code.includes("def solve(self):\n        pass"))) {
        handleCodeChange(codeToApply);
      }

      if (response.error) {
        showToast(`⚠️ ${response.error}`);
      } else {
        showToast(`Stage "${stageToRun}" complete!`);
      }
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
    let hasFallbackError: string | null = null;

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

        if (response.error) {
          hasFallbackError = response.error;
        }

        if (response.content) {
          accumulatedOutputs[stg] = response.content;
          setStageOutputs((prev) => ({ ...prev, [stg]: response.content }));
        }

        let codeToApply = response.code;
        if (!codeToApply && response.content && stg === "generate") {
          const match = response.content.match(/```(?:[a-zA-Z0-9_#+-]+)?\s*\n([\s\S]*?)```/);
          if (match) {
            codeToApply = match[1].trim();
          }
        }
        if (codeToApply && (stg === "generate" || !code || code.includes("// Implement solution") || code.includes("def solve(self):\n        pass"))) {
          handleCodeChange(codeToApply);
        }
      } catch (err: any) {
        hasFallbackError = err.message || `Stage ${stg} error`;
        console.warn(`Stage ${stg} error:`, err);
        // Continue rather than breaking so subsequent stages & code generation still succeed
      }
    }

    // Safety check: ensure editor has the generated code if available
    if (accumulatedOutputs["generate"]) {
      const match = accumulatedOutputs["generate"].match(/```(?:[a-zA-Z0-9_#+-]+)?\s*\n([\s\S]*?)```/);
      if (match && (!code || code.includes("// Implement solution") || code.includes("def solve(self):\n        pass"))) {
        handleCodeChange(match[1].trim());
      }
    }

    setIsRunning(false);
    setMobileTab("editor");
    if (hasFallbackError) {
      showToast(`⚠️ Notice: ${hasFallbackError}`);
    } else {
      showToast("✨ AI Solution generated & verified!");
    }
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

  // Run code against real test cases
  const handleRunCode = async () => {
    if (!problem || !code.trim() || isRunningCode) return;
    setIsRunningCode(true);
    setConsoleOpen(true);
    setConsoleTab("result");
    setSelectedCaseIndex(0);

    const tcs: TestCaseItem[] =
      customTestCases && customTestCases.length > 0
        ? customTestCases
        : (problem.examples || []).map((ex) => ({
            input: ex.input,
            expected_output: ex.output,
          }));

    try {
      const resp = await runCode({
        problem_slug: problem.slug,
        problem_title: problem.title,
        language: language,
        code: code,
        testcases: tcs,
      });
      setRunResult(resp);
      if (resp.status === "ACCEPTED") {
        showToast("Accepted: All testcases passed! 🎉");
      } else if (resp.status === "COMPILE_ERROR") {
        showToast("Compilation Error: See details in console");
      } else if (resp.status === "RUNTIME_ERROR") {
        showToast("Runtime Error: Check console output");
      } else if (resp.status === "TIME_LIMIT_EXCEEDED") {
        showToast("Time Limit Exceeded");
      } else {
        showToast(`${resp.passed_tests}/${resp.total_tests} testcases passed.`);
      }
    } catch (err: any) {
      setRunResult({
        success: false,
        status: "RUNTIME_ERROR",
        message: err.message || "Execution error",
        total_tests: tcs.length,
        passed_tests: 0,
        runtime_ms: 0,
        runtime_error: err.message || "Unknown error",
        results: [],
      });
      showToast(`Error: ${err.message}`);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleAddTestCase = () => {
    setCustomTestCases((prev) => [
      ...prev,
      { input: "", expected_output: "" },
    ]);
    setSelectedCaseIndex(customTestCases.length);
    setConsoleTab("testcase");
    setConsoleOpen(true);
  };

  const handleUpdateTestCase = (index: number, field: "input" | "expected_output", val: string) => {
    setCustomTestCases((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: val };
      }
      return updated;
    });
  };

  const handleDeleteTestCase = (index: number) => {
    if (customTestCases.length <= 1) return;
    setCustomTestCases((prev) => prev.filter((_, i) => i !== index));
    if (selectedCaseIndex >= index && selectedCaseIndex > 0) {
      setSelectedCaseIndex((prev) => prev - 1);
    }
  };

  const handleResetTestCases = () => {
    if (problem?.examples && problem.examples.length > 0) {
      setCustomTestCases(
        problem.examples.map((ex) => ({
          input: ex.input,
          expected_output: ex.output,
        }))
      );
      setSelectedCaseIndex(0);
      showToast("Reset to official example test cases");
    }
  };

  // Sync testcases when problem changes
  useEffect(() => {
    if (problem?.examples && problem.examples.length > 0) {
      setCustomTestCases(
        problem.examples.map((ex) => ({
          input: ex.input,
          expected_output: ex.output,
        }))
      );
    } else {
      setCustomTestCases([]);
    }
    setRunResult(null);
    setSelectedCaseIndex(0);
  }, [problem?.slug]);

  // Ctrl+Enter / Cmd+Enter hotkey to run tests
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [problem, code, language, customTestCases, isRunningCode]);


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
    <div className="flex flex-col flex-1 h-full max-h-full min-h-0 gap-2 max-w-full overflow-hidden">
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
        className="card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-2.5 sm:p-3 shrink-0"
        style={{ borderRadius: "12px" }}
      >
        {/* Problem Title & Difficulty */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          {problem && (
            <>
              <DifficultyBadge difficulty={problem.difficulty} />
              <ProblemStatusBadge isSolved={isSolved} size="sm" showAccountHint={isSolved} />
              <h2
                className="text-sm sm:text-base font-bold truncate text-white"
                title={problem.title}
              >
                {problem.id ? `#${problem.id} ` : ""}
                {problem.title}
              </h2>
              <button
                onClick={() => setShowUrlModal(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border text-cyan-300 hover:text-white bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer shrink-0"
                title="Paste any LeetCode problem or contest URL/slug to fetch live"
              >
                <Link size={12} className="text-cyan-400" />
                <span>Fetch by URL</span>
              </button>
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
            onChange={(e) => {
              const newModel = e.target.value;
              setSelectedModel(newModel);
              setModelId(newModel);
            }}
            className="hidden sm:block px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer max-w-[240px] truncate border"
            title="Active Model & Reasoning Tier"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            <optgroup label="⚡ Fast / Low-Latency Tier (<1.0s)">
              {models.filter((m) => m.tier === "low").map((m) => {
                const ready = isModelKeyConfigured(m);
                return (
                  <option key={m.id} value={m.id}>
                    [Low] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key_name || "Key"}`}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label="🚀 Balanced / Medium Tier (Optimal DSA)">
              {models.filter((m) => m.tier === "medium").map((m) => {
                const ready = isModelKeyConfigured(m);
                return (
                  <option key={m.id} value={m.id}>
                    [Med] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key_name || "Key"}`}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label="🧠 High Reasoning Tier (Hard DP & Proofs)">
              {models.filter((m) => m.tier === "high").map((m) => {
                const ready = isModelKeyConfigured(m);
                return (
                  <option key={m.id} value={m.id}>
                    [High] {m.name} • {ready ? "✓ Ready" : `⚠️ Needs ${m.required_key_name || "Key"}`}
                  </option>
                );
              })}
            </optgroup>
          </select>

          {/* Real-time Dynamic Split Slider (Desktop) */}
          <div
            className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs"
            style={{
              background: "var(--color-bg-elevated)",
              borderColor: "var(--color-border)",
            }}
            title="Drag slider to dynamically adjust Left (Chat) vs Right (Code) width in real time"
          >
            <Columns size={13} className="text-cyan-400 shrink-0" />
            <span className="font-mono text-[10px] text-gray-300 whitespace-nowrap">
              Split: <strong className="text-cyan-300">{Math.round(splitRatio)}%</strong> /{" "}
              <strong className="text-purple-300">{100 - Math.round(splitRatio)}%</strong>
            </span>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={Math.round(splitRatio)}
              onChange={(e) => handleUpdateSplitRatio(Number(e.target.value))}
              className="w-16 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* UI Scale / Density Zoom Toggle Button */}
          <button
            onClick={handleCycleUiDensity}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer touch-target"
            style={{
              background: "var(--color-bg-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            title="Toggle UI Display Scale & Density (75% Zoom Feel vs Standard)"
          >
            <ZoomIn size={13} className="text-cyan-400" />
            <span className="hidden md:inline">
              {uiDensityState === "compact"
                ? "Scale: 75% Sleek"
                : uiDensityState === "medium"
                ? "Scale: 88% Med"
                : "Scale: 100% Std"}
            </span>
          </button>

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
            {tab === "editor" ? "Code" : tab === "research" ? "AI Chat" : tab}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout: Responsive Resizable Flex Container */}
      <div
        ref={workspaceContainerRef}
        className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0 h-full max-h-full w-full relative overflow-hidden"
      >
        {/* Left Column: Problem / Reasoning / AI Assistant */}
        <div
          className={`flex-col card p-0 overflow-hidden min-h-0 h-full max-h-full ${
            mobileTab !== "editor" ? "flex" : "hidden lg:flex"
          }`}
          style={{
            width: isDesktop ? `${splitRatio}%` : "100%",
            transition: isDraggingSplit ? "none" : "width 0.12s ease-out",
          }}
        >
          {/* Desktop Left Tab Bar */}
          <div
            className="hidden lg:flex items-center px-3 pt-2 gap-1 border-b shrink-0"
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
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                mobileTab === "research" ? "border-b-2 text-white" : "text-muted hover:text-white"
              }`}
              style={{
                borderColor: mobileTab === "research" ? "var(--color-accent)" : "transparent",
                color: mobileTab === "research" ? "var(--color-accent)" : "var(--color-text-secondary)",
              }}
            >
              <Sparkles size={13} className="text-cyan-400" />
              <span>AI Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </button>

          </div>

          {/* Left Content Area */}
          <div
            className={`flex-1 min-h-0 h-full max-h-full ${
              mobileTab === "research" ? "p-1.5 flex flex-col overflow-hidden" : "overflow-y-auto p-4 space-y-4"
            }`}
          >
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

            {/* 3. AI Assistant Smart Chat Tab */}
            {mobileTab === "research" && (
              <div className="flex-1 h-full min-h-0 max-h-full flex flex-col overflow-hidden">
                <ProblemAIChat
                  problem={problem}
                  code={code}
                  language={language}
                  selectedModel={selectedModel}
                  onModelChange={(newModel) => {
                    setSelectedModel(newModel);
                    setModelId(newModel);
                  }}
                  onApplyCode={(newCode) => {
                    handleCodeChange(newCode);
                    showToast("Code applied to editor!");
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Draggable Resizer Slider Bar (Visible on Desktop) */}
        <div
          onPointerDown={handleSplitPointerDown}
          onPointerMove={handleSplitPointerMove}
          onPointerUp={handleSplitPointerUp}
          onMouseDown={handleSplitMouseDown}
          onDoubleClick={() => handleUpdateSplitRatio(50)}
          className={`hidden lg:flex items-center justify-center w-3.5 hover:w-4 cursor-col-resize select-none relative group z-20 transition-all shrink-0 ${
            isDraggingSplit ? "w-4" : ""
          }`}
          title="Drag left/right to resize panels in real time • Double-click to reset 50/50"
        >
          {/* Floating Live Percentage Badge During Drag */}
          {isDraggingSplit && (
            <div className="absolute top-1/2 -translate-y-1/2 -left-16 z-30 px-2 py-1 rounded-md bg-cyan-500 text-black font-mono font-bold text-[11px] shadow-xl pointer-events-none whitespace-nowrap">
              {Math.round(splitRatio)}% | {100 - Math.round(splitRatio)}%
            </div>
          )}

          {/* Vertical divider line with glow on hover/drag */}
          <div
            className={`w-[2px] h-[98%] rounded transition-all ${
              isDraggingSplit
                ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                : "bg-[var(--color-border-subtle)] group-hover:bg-cyan-400/80 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)]"
            }`}
          />
          {/* Central Grip Handle Pill */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-full bg-[var(--color-bg-secondary)] border shadow-md flex items-center justify-center transition-all ${
              isDraggingSplit
                ? "border-cyan-400 bg-cyan-950 scale-110 shadow-cyan-500/30"
                : "border-[var(--color-border)] group-hover:border-cyan-400/80 group-hover:scale-105"
            }`}
          >
            <GripVertical
              size={12}
              className={`transition-colors ${
                isDraggingSplit ? "text-cyan-300" : "text-gray-400 group-hover:text-cyan-300"
              }`}
            />
          </div>
        </div>

        {/* Right Column: Code Editor */}
        <div
          className={`flex flex-col card p-0 overflow-hidden min-h-0 h-full max-h-full ${
            mobileTab === "editor" ? "flex" : "hidden lg:flex"
          }`}
          style={{
            width: isDesktop ? `${100 - splitRatio}%` : "100%",
            transition: isDraggingSplit ? "none" : "width 0.12s ease-out",
          }}
        >
          {/* Editor Action Header */}
          <div
            className="flex flex-wrap items-center justify-between px-3 py-2 border-b gap-2 shrink-0"
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
                title="Reset to Official Starter Template"
              >
                <RotateCcw size={13} />
              </button>

              {/* Toggle Lightweight/Monaco Editor */}
              <button
                onClick={() => setUseSimpleEditor((prev) => !prev)}
                className={`p-1.5 rounded hover:bg-white/10 cursor-pointer touch-target flex items-center justify-center text-xs transition-colors ${
                  useSimpleEditor ? "text-cyan-400 bg-cyan-950/40 border border-cyan-500/30" : "text-muted hover:text-white"
                }`}
                title={useSimpleEditor ? "Switch to Monaco Pro Editor" : "Switch to Lightweight Editor"}
              >
                <Code2 size={13} />
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
                title="Save draft solution"
              >
                <Save size={13} />
                Save
              </button>

              {/* Run Button (Green Play icon next to Save) */}
              <button
                id="btn-run-tests"
                onClick={handleRunCode}
                disabled={isRunningCode || !code.trim()}
                className="px-3 py-1 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer touch-target border transition-all text-white shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderColor: "#059669",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.35)",
                }}
                title="Run Real Testcases (Ctrl + Enter)"
              >
                {isRunningCode ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Play size={13} className="fill-current" />
                )}
                <span>{isRunningCode ? "Running..." : "Run"}</span>
              </button>
            </div>
          </div>


          {/* Code Editor Body */}
          <div className="flex-1 w-full min-h-[220px] relative overflow-hidden bg-[#1e1e1e]">
            <div className="absolute inset-0 w-full h-full">
              {!useSimpleEditor ? (
                <Editor
                  height="100%"
                  language={currentLangObj.monacoLang}
                  value={code}
                  theme="vs-dark"
                  onMount={handleEditorDidMount}
                  loading={
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted text-xs bg-[#1e1e1e]">
                      <Sparkles className="animate-spin text-cyan-400" size={24} />
                      <span className="font-mono text-gray-400">Loading Code Editor...</span>
                    </div>
                  }
                  onChange={(val) => handleCodeChange(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: wordWrap ? "on" : "off",
                    wrappingStrategy: "advanced",
                    wrappingIndent: "indent",
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    cursorSmoothCaretAnimation: "on",
                    smoothScrolling: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              ) : (
                /* Accessible & Lightweight Styled Code Editor */
                <div className="flex w-full h-full bg-[#1e1e1e] font-mono text-xs overflow-hidden">
                  <div className="select-none py-3 px-2.5 text-right text-gray-600 bg-[#181818] border-r border-white/5 font-mono text-[11px] min-w-[38px]">
                    {(code || "").split("\n").map((_, i) => (
                      <div key={i} className="leading-5 h-5">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const nextVal = code.substring(0, start) + "    " + code.substring(end);
                        handleCodeChange(nextVal);
                        setTimeout(() => {
                          target.selectionStart = target.selectionEnd = start + 4;
                        }, 0);
                      }
                    }}
                    className="flex-1 h-full p-3 font-mono bg-transparent text-gray-200 outline-none resize-none leading-5"
                    style={{
                      fontSize: `${fontSize}px`,
                      whiteSpace: wordWrap ? "pre-wrap" : "pre",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                    spellCheck={false}
                    placeholder="// Write your solution here..."
                  />
                </div>
              )}
            </div>

            {/* Empty State Overlay */}
            {(!code || !code.trim()) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[var(--color-bg-card)]/95 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 text-cyan-400">
                  <FileCode size={24} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Editor is Empty</h3>
                <p className="text-xs text-muted mb-4 max-w-xs">
                  No code snippet is loaded for {problem?.title || "this problem"} in {currentLangObj.label}.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleResetStarter}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-white hover:border-cyan-400/50 transition-colors shadow-sm"
                  >
                    <RotateCcw size={13} className="text-cyan-400" />
                    <span>Load Starter Template</span>
                  </button>
                  <button
                    onClick={handleRunFullPipeline}
                    disabled={isRunning || !problem}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer text-white shadow-md transition-all hover:scale-105"
                    style={{
                      background: "var(--color-accent)",
                      boxShadow: "0 0 14px var(--color-accent-glow)",
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Auto-Solve with AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Interactive LeetCode Testcase & Execution Results Console ─── */}
          <div
            className={`border-t flex flex-col transition-all duration-200 z-10 shrink-0 ${
              consoleOpen ? "h-72 sm:h-80" : "h-9"
            }`}
            style={{
              background: "#16181d",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            {/* Console Control Bar */}
            <div
              className="flex items-center justify-between px-3 h-9 select-none shrink-0 border-b"
              style={{
                borderColor: "rgba(255, 255, 255, 0.06)",
                background: "#1a1d24",
              }}
            >
              {/* Tabs: Testcase & Test Result */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setConsoleTab("testcase");
                    setConsoleOpen(true);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                    consoleTab === "testcase" && consoleOpen
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Terminal size={12} className="text-cyan-400" />
                  <span>Testcase</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-white/5 text-gray-400">
                    {customTestCases.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setConsoleTab("result");
                    setConsoleOpen(true);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                    consoleTab === "result" && consoleOpen
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Play
                    size={11}
                    className={isRunningCode ? "text-emerald-400 animate-spin" : "text-emerald-400 fill-current"}
                  />
                  <span>Test Result</span>

                  {/* Status Indicator Pill */}
                  {runResult && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                        runResult.status === "ACCEPTED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : runResult.status === "COMPILE_ERROR"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : runResult.status === "RUNTIME_ERROR"
                          ? "bg-red-500/20 text-rose-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {runResult.status === "ACCEPTED" && <CheckCircle2 size={10} />}
                      {runResult.status === "COMPILE_ERROR" && <AlertTriangle size={10} />}
                      {runResult.status === "RUNTIME_ERROR" && <AlertTriangle size={10} />}
                      {runResult.status === "WRONG_ANSWER" && <XCircle size={10} />}
                      {runResult.status === "ACCEPTED"
                        ? "Passed"
                        : runResult.status === "COMPILE_ERROR"
                        ? "Compile Error"
                        : runResult.status === "RUNTIME_ERROR"
                        ? "Runtime Error"
                        : "Wrong Answer"}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Quick Run & Expand/Collapse Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode || !code.trim()}
                  className="px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs"
                  title="Run code against tests (Ctrl+Enter)"
                >
                  {isRunningCode ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Play size={10} className="fill-current" />
                  )}
                  <span>Run</span>
                </button>

                <button
                  onClick={() => setConsoleOpen(!consoleOpen)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={consoleOpen ? "Collapse Console" : "Expand Console"}
                >
                  {consoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>

            {/* Console Body (Shown when open) */}
            {consoleOpen && (
              <div className="flex-1 overflow-y-auto p-3 text-xs bg-[#131519] flex flex-col min-h-0">
                {/* ─── TAB 1: Testcase Editor ─── */}
                {consoleTab === "testcase" && (
                  <div className="flex flex-col h-full space-y-2.5">
                    {/* Testcase Pills */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1 border-b border-white/5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {customTestCases.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCaseIndex(i)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                              selectedCaseIndex === i
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                            }`}
                          >
                            <span>Case {i + 1}</span>
                          </button>
                        ))}

                        <button
                          onClick={handleAddTestCase}
                          className="px-2 py-1 text-xs rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 border border-white/5"
                          title="Add custom test case"
                        >
                          <Plus size={11} />
                          <span>Add Case</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {customTestCases.length > 1 && (
                          <button
                            onClick={() => handleDeleteTestCase(selectedCaseIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer rounded hover:bg-red-500/10"
                            title="Delete this test case"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={handleResetTestCases}
                          className="text-[11px] text-gray-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw size={10} />
                          <span>Reset Cases</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Case Inputs */}
                    {customTestCases[selectedCaseIndex] ? (
                      <div className="flex-1 flex flex-col space-y-2">
                        <div>
                          <div className="text-[11px] font-mono text-gray-400 mb-1 flex items-center justify-between">
                            <span>Input:</span>
                            <span className="text-[10px] text-gray-500">
                              (e.g. nums = [1,5,2,4,1,3,0], k = 2)
                            </span>
                          </div>
                          <textarea
                            value={customTestCases[selectedCaseIndex].input}
                            onChange={(e) =>
                              handleUpdateTestCase(selectedCaseIndex, "input", e.target.value)
                            }
                            rows={3}
                            placeholder="nums = [1, 2, 3]"
                            className="w-full p-2.5 font-mono text-xs rounded-lg bg-[#0d0e12] border border-white/10 text-gray-200 outline-none focus:border-cyan-500/50 resize-none"
                          />
                        </div>

                        <div>
                          <div className="text-[11px] font-mono text-gray-400 mb-1">
                            Expected Output (optional):
                          </div>
                          <input
                            type="text"
                            value={customTestCases[selectedCaseIndex].expected_output || ""}
                            onChange={(e) =>
                              handleUpdateTestCase(selectedCaseIndex, "expected_output", e.target.value)
                            }
                            placeholder="e.g. 9 or [0, 1] or true"
                            className="w-full p-2 font-mono text-xs rounded-lg bg-[#0d0e12] border border-white/10 text-gray-200 outline-none focus:border-cyan-500/50"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">No test cases available.</div>
                    )}
                  </div>
                )}

                {/* ─── TAB 2: Test Result ─── */}
                {consoleTab === "result" && (
                  <div className="flex flex-col h-full overflow-y-auto space-y-3">
                    {/* Loading State */}
                    {isRunningCode && (
                      <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-center">
                        <Loader2 className="animate-spin text-emerald-400" size={26} />
                        <span className="font-semibold text-gray-200 text-xs">
                          Compiling and executing code...
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          Testing against {customTestCases.length} case(s) in {currentLangObj.label}
                        </span>
                      </div>
                    )}

                    {/* No Run Yet */}
                    {!isRunningCode && !runResult && (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 gap-2">
                        <Play size={24} className="text-gray-600" />
                        <p className="text-xs">You have not run any testcases yet.</p>
                        <button
                          onClick={handleRunCode}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-sm transition-all"
                        >
                          Run Code Now
                        </button>
                      </div>
                    )}

                    {/* Execution Finished */}
                    {!isRunningCode && runResult && (
                      <div className="space-y-3">
                        {/* Overall Status Banner */}
                        <div
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                            runResult.status === "ACCEPTED"
                              ? "bg-emerald-950/30 border-emerald-500/30"
                              : runResult.status === "COMPILE_ERROR"
                              ? "bg-red-950/40 border-red-500/40"
                              : runResult.status === "RUNTIME_ERROR"
                              ? "bg-rose-950/40 border-rose-500/40"
                              : runResult.status === "TIME_LIMIT_EXCEEDED"
                              ? "bg-amber-950/30 border-amber-500/30"
                              : "bg-red-950/30 border-red-500/30"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {runResult.status === "ACCEPTED" && (
                              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                            )}
                            {(runResult.status === "COMPILE_ERROR" || runResult.status === "RUNTIME_ERROR") && (
                              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            )}
                            {runResult.status === "WRONG_ANSWER" && (
                              <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            )}
                            {runResult.status === "TIME_LIMIT_EXCEEDED" && (
                              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                            )}

                            <div>
                              <div
                                className={`font-bold text-sm ${
                                  runResult.status === "ACCEPTED"
                                    ? "text-emerald-400"
                                    : runResult.status === "TIME_LIMIT_EXCEEDED"
                                    ? "text-amber-400"
                                    : "text-red-400"
                                }`}
                              >
                                {runResult.status === "ACCEPTED"
                                  ? "Accepted"
                                  : runResult.status === "COMPILE_ERROR"
                                  ? "Compile Error"
                                  : runResult.status === "RUNTIME_ERROR"
                                  ? "Runtime Error"
                                  : runResult.status === "TIME_LIMIT_EXCEEDED"
                                  ? "Time Limit Exceeded"
                                  : "Wrong Answer"}
                              </div>
                              <p className="text-xs text-gray-300 mt-0.5">
                                {runResult.message}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {runResult.runtime_ms > 0 && (
                              <span className="text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                ⚡ {runResult.runtime_ms} ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compilation Error Diagnostics (SHOW ERROR ALWAYS AS REQUESTED) */}
                        {runResult.compile_error && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-red-400 flex items-center justify-between">
                              <span>Compiler Error Output:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(runResult.compile_error || "");
                                  showToast("Copied compile error");
                                }}
                                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Copy size={10} />
                                <span>Copy Error</span>
                              </button>
                            </div>
                            <pre className="p-3 rounded-lg font-mono text-[11px] bg-[#0c0d10] border border-red-500/30 text-red-300 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
                              {runResult.compile_error}
                            </pre>
                          </div>
                        )}

                        {/* Runtime Error Trace */}
                        {runResult.runtime_error && !runResult.compile_error && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-rose-400 flex items-center justify-between">
                              <span>Runtime Exception Trace:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(runResult.runtime_error || "");
                                  showToast("Copied error trace");
                                }}
                                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Copy size={10} />
                                <span>Copy Trace</span>
                              </button>
                            </div>
                            <pre className="p-3 rounded-lg font-mono text-[11px] bg-[#0c0d10] border border-rose-500/30 text-rose-300 overflow-x-auto whitespace-pre leading-relaxed select-text shadow-inner">
                              {runResult.runtime_error}
                            </pre>
                          </div>
                        )}

                        {/* Testcase Results Breakdown */}
                        {runResult.results && runResult.results.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {/* Case Selector Pills */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {runResult.results.map((r, i) => {
                                const isPassed = r.status === "PASSED";
                                const isSelected = selectedCaseIndex === i;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedCaseIndex(i)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 border ${
                                      isSelected
                                        ? isPassed
                                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                          : "bg-red-500/20 text-red-300 border-red-500/40"
                                        : isPassed
                                        ? "bg-white/5 text-emerald-400/80 border-transparent hover:border-emerald-500/30"
                                        : "bg-white/5 text-red-400/80 border-transparent hover:border-red-500/30"
                                    }`}
                                  >
                                    {isPassed ? (
                                      <CheckCircle2 size={11} className="text-emerald-400" />
                                    ) : (
                                      <XCircle size={11} className="text-red-400" />
                                    )}
                                    <span>Case {i + 1}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Active Case Inspection */}
                            {runResult.results[selectedCaseIndex] && (
                              <div className="p-3 rounded-xl bg-[#0e1014] border border-white/5 space-y-2 font-mono text-xs">
                                <div>
                                  <span className="text-gray-400 text-[11px] block mb-0.5">Input:</span>
                                  <div className="p-2 rounded bg-black/40 border border-white/5 text-gray-200">
                                    {runResult.results[selectedCaseIndex].input}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-400 text-[11px] block mb-0.5">Your Output:</span>
                                    <div
                                      className={`p-2 rounded border font-semibold ${
                                        runResult.results[selectedCaseIndex].status === "PASSED"
                                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                                          : "bg-red-950/20 border-red-500/30 text-red-400"
                                      }`}
                                    >
                                      {runResult.results[selectedCaseIndex].actual_output ?? "null / error"}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-gray-400 text-[11px] block mb-0.5">Expected:</span>
                                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 font-semibold">
                                      {runResult.results[selectedCaseIndex].expected_output ?? "None"}
                                    </div>
                                  </div>
                                </div>

                                {runResult.results[selectedCaseIndex].error && (
                                  <div>
                                    <span className="text-red-400 text-[11px] block mb-0.5">Error:</span>
                                    <pre className="p-2 rounded bg-red-950/30 border border-red-500/30 text-red-300 text-[11px] overflow-x-auto whitespace-pre">
                                      {runResult.results[selectedCaseIndex].error}
                                    </pre>
                                  </div>
                                )}

                                {runResult.results[selectedCaseIndex].stdout && (
                                  <div>
                                    <span className="text-gray-400 text-[11px] block mb-0.5">Stdout:</span>
                                    <pre className="p-2 rounded bg-black/40 border border-white/5 text-gray-300 text-[11px] overflow-x-auto whitespace-pre">
                                      {runResult.results[selectedCaseIndex].stdout}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
          onClick={handleRunCode}
          disabled={isRunningCode || !code.trim()}
          className="flex-1 py-3 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-white cursor-pointer touch-target shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          {isRunningCode ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} className="fill-current" />
          )}
          <span>{isRunningCode ? "Running..." : "Run Tests"}</span>
        </button>

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
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
        >
          <Copy size={15} />
          <span>Copy</span>
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

      {/* Fetch by URL / Contest Link Modal */}
      {showUrlModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowUrlModal(false)}
        >
          <div
            className="w-full max-w-lg p-5 rounded-2xl border space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Link size={18} />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Fetch Problem by LeetCode URL or Slug
                  </h3>
                  <p className="text-[11px] text-muted">
                    Paste any LeetCode problem, contest problem, or submission link.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFetchProblemByUrl} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  LeetCode URL or Slug:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customProblemUrl}
                  onChange={(e) => {
                    setCustomProblemUrl(e.target.value);
                    if (urlFetchError) setUrlFetchError("");
                  }}
                  placeholder="https://leetcode.com/contest/.../problems/count-frequency-staircase-subarrays-i/ or count-frequency-staircase-subarrays-i"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono text-white focus:border-cyan-400"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: urlFetchError ? "var(--color-danger)" : "var(--color-border)",
                  }}
                />
              </div>

              {urlFetchError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {urlFetchError}
                </div>
              )}

              {/* Quick suggestions */}
              <div className="space-y-1.5 text-[11px]">
                <span className="text-muted block font-medium">Quick suggestions (Contest / Live):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Count Frequency Staircase Subarrays I", slug: "count-frequency-staircase-subarrays-i" },
                    { label: "Count Frequency Staircase Subarrays II", slug: "count-frequency-staircase-subarrays-ii" },
                    { label: "Create Grid With Exactly One Path", slug: "create-grid-with-exactly-one-path" },
                  ].map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => setCustomProblemUrl(s.slug)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-secondary text-secondary hover:text-white border border-border-subtle cursor-pointer hover:border-cyan-500/40 transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border-subtle hover:bg-white/5 text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fetchingCustomProblem || !customProblemUrl.trim()}
                  className="px-5 py-2 text-xs font-bold rounded-xl text-white flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  style={{ background: "var(--color-accent)" }}
                >
                  {fetchingCustomProblem ? (
                    <>
                      <Sparkles size={13} className="animate-spin" />
                      <span>Fetching from LeetCode...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight size={13} />
                      <span>Load Problem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
