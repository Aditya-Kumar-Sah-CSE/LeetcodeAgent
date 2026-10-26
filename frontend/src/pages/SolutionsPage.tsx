import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  FolderCode,
  Search,
  Trash2,
  Copy,
  Download,
  Code2,
  Calendar,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

import { getAllSolutionsLocal, deleteSolutionLocal } from "../services/storage";
import { deleteSolution as deleteApiSolution } from "../services/api";
import { copyToClipboard, getCanonicalLeetCodeUrl } from "../services/leetcodeNavigation";
import { LANGUAGES, type StoredSolution } from "../types";
import { LoadingCard } from "../components/UIComponents";
import SubmissionModal from "../components/SubmissionModal";

export default function SolutionsPage() {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<StoredSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState<StoredSolution | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Submission modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSolutions = async () => {
    setLoading(true);
    try {
      const data = await getAllSolutionsLocal();
      setSolutions(data);
      if (data.length > 0 && !selectedSolution) {
        setSelectedSolution(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSolutions();
  }, []);

  const handleSelectSolution = (sol: StoredSolution) => {
    setSelectedSolution(sol);
    setMobileDetailOpen(true);
  };

  const handleDelete = async (sol: StoredSolution) => {
    if (!confirm(`Delete solution for "${sol.problem_title}" (${sol.language})?`)) return;
    await deleteSolutionLocal(sol.problem_slug, sol.language);
    await deleteApiSolution(sol.problem_slug, sol.language).catch(() => {});
    const updated = solutions.filter((s) => s.id !== sol.id);
    setSolutions(updated);
    if (selectedSolution?.id === sol.id) {
      setSelectedSolution(updated[0] || null);
      setMobileDetailOpen(false);
    }
    showToast("Solution deleted");
  };

  const handleCopy = async (code: string) => {
    const res = await copyToClipboard(code);
    if (res.success) {
      showToast("Solution copied to clipboard!");
    } else {
      showToast("Clipboard copy failed. Please select code manually.");
    }
  };

  const handleCopyAndSubmit = async (sol: StoredSolution) => {
    const res = await copyToClipboard(sol.code);
    setCopySuccess(res.success);
    if (res.success) {
      showToast("Solution copied to clipboard!");
    }
    setSubmitModalOpen(true);
  };

  const handleDownload = (sol: StoredSolution) => {
    const ext = LANGUAGES.find((l) => l.value === sol.language)?.ext || "txt";
    const filename = `${sol.problem_slug}.${ext}`;
    const blob = new Blob([sol.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const filtered = solutions.filter((s) => {
    const matchesSearch =
      s.problem_title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.problem_slug.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesLang = langFilter === "all" || s.language === langFilter;
    return matchesSearch && matchesLang;
  });

  const currentMonacoLang =
    LANGUAGES.find((l) => l.value === selectedSolution?.language)?.monacoLang || "python";

  return (
    <div className="flex flex-col min-h-[calc(100vh-6.5rem)] space-y-4 pb-safe max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border animate-bounce backdrop-blur-md"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-accent)",
            color: "var(--color-text-primary)",
          }}
        >
          <Sparkles size={15} style={{ color: "var(--color-accent)" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <FolderCode size={22} style={{ color: "var(--color-accent)" }} />
            Saved Solutions
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-muted">
            Manage, export, and submit your saved solutions.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search solutions..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border outline-none touch-target"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer border touch-target"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border-subtle)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingCard lines={6} />
      ) : solutions.length === 0 ? (
        <div
          className="card text-center py-16 flex flex-col items-center justify-center space-y-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          <FolderCode size={44} className="opacity-40" />
          <h3 className="text-base font-semibold text-white">No solutions saved yet</h3>
          <p className="text-xs max-w-sm">
            Solve problems using the AI workspace and tap "Save" to build your local solution repository.
          </p>
          <button
            onClick={() => navigate("/workspace")}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent text-white cursor-pointer hover:opacity-90 touch-target"
          >
            Go to AI Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[500px]">
          {/* Solutions List (Full width on mobile when detail is closed, 4 cols on desktop) */}
          <div
            className={`lg:col-span-4 card p-0 overflow-y-auto space-y-1 ${
              mobileDetailOpen ? "hidden lg:block" : "block"
            }`}
          >
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No solutions match your search.
              </div>
            ) : (
              filtered.map((sol) => {
                const isSelected = selectedSolution?.id === sol.id;
                return (
                  <div
                    key={sol.id}
                    onClick={() => handleSelectSolution(sol)}
                    className="p-3.5 border-b transition-all cursor-pointer flex flex-col gap-1.5 touch-target"
                    style={{
                      background: isSelected ? "var(--color-accent-glow)" : "transparent",
                      borderColor: "var(--color-border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate max-w-[200px] text-white">
                        {sol.problem_title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize bg-elevated text-accent">
                        {sol.language}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(sol.updated_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono text-[10px] truncate max-w-[120px]">
                        {sol.problem_slug}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Solution Code Preview (Full width on mobile when open, 8 cols on desktop) */}
          <div
            className={`lg:col-span-8 card p-0 overflow-hidden flex-col h-[520px] lg:h-auto ${
              mobileDetailOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            {selectedSolution ? (
              <>
                {/* Header bar */}
                <div
                  className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2.5 border-b gap-2"
                  style={{
                    background: "var(--color-bg-secondary)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileDetailOpen(false)}
                      className="lg:hidden p-1.5 rounded-lg text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center"
                      title="Back to list"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <Code2 size={16} style={{ color: "var(--color-accent)" }} className="shrink-0" />
                    <span className="text-xs font-bold text-white truncate">
                      {selectedSolution.problem_title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-mono bg-elevated text-secondary shrink-0">
                      {selectedSolution.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyAndSubmit(selectedSolution)}
                      className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer touch-target text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                      title="Copy Solution & Open LeetCode"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">Copy & Submit</span>
                      <span className="sm:hidden">Submit</span>
                    </button>
                    <button
                      onClick={() => handleCopy(selectedSolution.code)}
                      className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer text-muted hover:text-white touch-target"
                      title="Copy Code"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleDownload(selectedSolution)}
                      className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer text-muted hover:text-white touch-target"
                      title="Download Solution"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedSolution)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-xs flex items-center gap-1 cursor-pointer text-red-400 touch-target"
                      title="Delete Solution"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                  <Editor
                    height="100%"
                    language={currentMonacoLang}
                    value={selectedSolution.code}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-muted flex items-center justify-center h-full">
                Select a solution to preview.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission Guidance Modal */}
      {selectedSolution && (
        <SubmissionModal
          isOpen={submitModalOpen}
          onClose={() => setSubmitModalOpen(false)}
          problemSlug={selectedSolution.problem_slug}
          problemTitle={selectedSolution.problem_title}
          language={selectedSolution.language}
          code={selectedSolution.code}
          copySuccess={copySuccess}
        />
      )}
    </div>
  );
}
