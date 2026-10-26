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
} from "lucide-react";

import { getAllSolutionsLocal, deleteSolutionLocal } from "../services/storage";
import { deleteSolution as deleteApiSolution } from "../services/api";
import { LANGUAGES, type StoredSolution } from "../types";
import { LoadingCard } from "../components/UIComponents";

export default function SolutionsPage() {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<StoredSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState<StoredSolution | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleDelete = async (sol: StoredSolution) => {
    if (!confirm(`Delete solution for "${sol.problem_title}" (${sol.language})?`)) return;
    await deleteSolutionLocal(sol.problem_slug, sol.language);
    await deleteApiSolution(sol.problem_slug, sol.language).catch(() => {});
    const updated = solutions.filter((s) => s.id !== sol.id);
    setSolutions(updated);
    if (selectedSolution?.id === sol.id) {
      setSelectedSolution(updated[0] || null);
    }
    showToast("Solution deleted");
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    showToast("Solution copied to clipboard!");
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
    <div className="flex flex-col h-[calc(100vh-5rem)] space-y-4">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <FolderCode size={24} style={{ color: "var(--color-accent)" }} />
            Saved Solutions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Review, export, and manage your algorithmic solutions.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search solutions..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none"
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
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer border"
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

      {/* Main Content: Split List and Preview */}
      {loading ? (
        <LoadingCard lines={6} />
      ) : solutions.length === 0 ? (
        <div
          className="card text-center py-16 flex flex-col items-center justify-center space-y-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          <FolderCode size={48} className="opacity-40" />
          <h3 className="text-base font-semibold text-white">No solutions saved yet</h3>
          <p className="text-xs max-w-sm">
            Solve problems using the AI workspace and click "Save" to build your repository of solutions.
          </p>
          <button
            onClick={() => navigate("/workspace")}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-white cursor-pointer hover:opacity-90"
          >
            Go to AI Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Solutions List (4 cols) */}
          <div className="lg:col-span-4 card p-0 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                No solutions match your filter.
              </div>
            ) : (
              filtered.map((sol) => {
                const isSelected = selectedSolution?.id === sol.id;
                return (
                  <div
                    key={sol.id}
                    onClick={() => setSelectedSolution(sol)}
                    className="p-3 border-b transition-all cursor-pointer flex flex-col gap-1.5"
                    style={{
                      background: isSelected
                        ? "var(--color-accent-glow)"
                        : "transparent",
                      borderColor: "var(--color-border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold truncate max-w-[180px]"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {sol.problem_title}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
                        style={{
                          background: "var(--color-bg-elevated)",
                          color: "var(--color-accent)",
                        }}
                      >
                        {sol.language}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-muted)" }}>
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

          {/* Solution Code Preview (8 cols) */}
          <div className="lg:col-span-8 card p-0 overflow-hidden flex flex-col h-full">
            {selectedSolution ? (
              <>
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{
                    background: "var(--color-bg-secondary)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Code2 size={16} style={{ color: "var(--color-accent)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {selectedSolution.problem_title}
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded uppercase font-mono"
                      style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
                    >
                      {selectedSolution.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(selectedSolution.code)}
                      className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer"
                      title="Copy Code"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Copy size={13} />
                      Copy
                    </button>
                    <button
                      onClick={() => handleDownload(selectedSolution)}
                      className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer"
                      title="Download Solution"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Download size={13} />
                      Export
                    </button>
                    <button
                      onClick={() => handleDelete(selectedSolution)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-xs flex items-center gap-1 cursor-pointer text-red-400"
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
              <div className="p-8 text-center text-xs text-muted">
                Select a solution from the list to preview code.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
