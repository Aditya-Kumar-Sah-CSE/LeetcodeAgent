import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  BookOpen,
  Search,
  Trash2,
  Copy,
  Download,
  Code2,
  Calendar,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Book,
  FileText,
  Lightbulb,
  CheckCircle2,
  Layers,
  Globe2,
  GitBranch,
  Printer,
  ChevronRight,
} from "lucide-react";

import { getAllSolutionsLocal, deleteSolutionLocal } from "../services/storage";
import { fetchSolutions, deleteSolution as deleteApiSolution } from "../services/api";
import { copyToClipboard, getCanonicalLeetCodeUrl } from "../services/leetcodeNavigation";
import { LANGUAGES, type StoredSolution, type SolutionFile } from "../types";
import { LoadingCard } from "../components/UIComponents";
import SubmissionModal from "../components/SubmissionModal";

type ExplanationLang = "english" | "hinglish";
type ActiveTab = "book" | "code" | "cheatsheet";

export default function SolutionsPage() {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<StoredSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState<StoredSolution | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [explanationLang, setExplanationLang] = useState<ExplanationLang>("english");
  const [activeTab, setActiveTab] = useState<ActiveTab>("book");
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
      const data = await fetchSolutions();
      // Map SolutionFile to StoredSolution
      const mapped: StoredSolution[] = data.map((s: SolutionFile) => ({
        id: `${s.problem_slug}-${s.language}`,
        problem_slug: s.problem_slug,
        problem_title: s.problem_title,
        language: s.language,
        code: s.code,
        created_at: s.created_at,
        updated_at: s.updated_at,
        problem_id: s.id,
        difficulty: s.difficulty || "Medium",
        tags: s.tags || [],
        date: s.date || s.created_at?.split("T")[0],
        url: s.url || getCanonicalLeetCodeUrl(s.problem_slug),
        concept: s.concept,
        trick_english: s.trick_english,
        trick_hinglish: s.trick_hinglish,
        summary_english: s.summary_english,
        summary_hinglish: s.summary_hinglish,
        topics_needed: s.topics_needed,
        stages_summary: s.stages_summary,
        folder: s.folder || s.problem_slug,
        source: "github",
      }));

      setSolutions(mapped);
      if (mapped.length > 0 && !selectedSolution) {
        setSelectedSolution(mapped[0]);
      }
    } catch (err) {
      console.error("Failed to load solutions:", err);
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
    showToast("Solution deleted from local storage");
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

  // Open the 2-page colorful PDF printable sheet
  const handleOpenPdfCheatsheet = (sol: StoredSolution) => {
    const folder = sol.folder || sol.problem_slug;
    const url = `./solutions/${folder}/cheatsheet.html`;
    window.open(url, "_blank");
  };

  // Open the monthly digest book
  const handleOpenMonthlyBook = () => {
    window.open("./solutions/books/2026-10-leetcode-solutions-book.html", "_blank");
  };

  const filtered = solutions.filter((s) => {
    const matchesSearch =
      s.problem_title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.problem_slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())));
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

      {/* Header with Language Selector & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <BookOpen size={24} style={{ color: "var(--color-accent)" }} />
            Online Solution Book & Cheat Sheets
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-muted">
            Structured explanations, memory tricks, 2-page colorful PDFs, and multi-language code stored directly in GitHub.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* English vs Hinglish Toggle */}
          <div
            className="flex items-center p-1 rounded-xl border"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <button
              onClick={() => setExplanationLang("english")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                explanationLang === "english"
                  ? "bg-accent text-white shadow"
                  : "text-muted hover:text-white"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
            <button
              onClick={() => setExplanationLang("hinglish")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                explanationLang === "hinglish"
                  ? "bg-accent text-white shadow"
                  : "text-muted hover:text-white"
              }`}
            >
              <span>🇮🇳</span>
              <span>Hinglish</span>
            </button>
          </div>

          {/* Monthly Book PDF Button */}
          <button
            onClick={handleOpenMonthlyBook}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border-indigo-500/30 text-cyan-300 hover:opacity-90 touch-target"
            title="Download or Read Full Monthly LeetCode Solutions Book"
          >
            <Book size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Monthly Book PDF</span>
            <span className="sm:hidden">Monthly Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search problem, tag, or topic..."
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

      {/* Main Content Layout */}
      {loading ? (
        <LoadingCard lines={6} />
      ) : solutions.length === 0 ? (
        <div
          className="card text-center py-16 flex flex-col items-center justify-center space-y-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          <BookOpen size={44} className="opacity-40" />
          <h3 className="text-base font-semibold text-white">No solutions available</h3>
          <p className="text-xs max-w-sm">
            Solutions are automatically saved and published to GitHub. Run the daily solver or generate solutions in the AI Workspace.
          </p>
          <button
            onClick={() => navigate("/workspace")}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-accent text-white cursor-pointer hover:opacity-90 touch-target"
          >
            Go to AI Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
          {/* Solutions List (Chapters Index) */}
          <div
            className={`lg:col-span-4 card p-0 overflow-y-auto space-y-1 ${
              mobileDetailOpen ? "hidden lg:block" : "block"
            }`}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between text-xs font-semibold"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border-subtle)",
                color: "var(--color-text-muted)",
              }}
            >
              <span>Problem Chapters ({filtered.length})</span>
              <span className="text-[10px] text-accent">GitHub Sync Active</span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No solutions match your search.
              </div>
            ) : (
              filtered.map((sol) => {
                const isSelected = selectedSolution?.id === sol.id;
                const diffColor =
                  sol.difficulty === "Easy"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : sol.difficulty === "Hard"
                    ? "text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                return (
                  <div
                    key={sol.id}
                    onClick={() => handleSelectSolution(sol)}
                    className="p-3.5 border-b transition-all cursor-pointer flex flex-col gap-1.5 touch-target hover:bg-white/5"
                    style={{
                      background: isSelected ? "var(--color-accent-glow)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--color-accent)" : "3px solid transparent",
                      borderColor: isSelected ? "var(--color-accent)" : "var(--color-border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate max-w-[210px] text-white">
                        {sol.problem_id ? `#${sol.problem_id} ` : ""}
                        {sol.problem_title}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${diffColor}`}>
                        {sol.difficulty}
                      </span>
                    </div>

                    {/* Tags snippet */}
                    {sol.tags && sol.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {sol.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-muted mt-0.5">
                      <span className="flex items-center gap-1 text-[10px]">
                        <Calendar size={11} />
                        {sol.date || new Date(sol.updated_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-0.5">
                        Read Chapter <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Solution Reader Panel (Online Book / Code / PDF) */}
          <div
            className={`lg:col-span-8 card p-0 overflow-hidden flex flex-col h-[650px] lg:h-auto ${
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
                    <button
                      onClick={() => setMobileDetailOpen(false)}
                      className="lg:hidden p-1.5 rounded-lg text-muted hover:text-white cursor-pointer touch-target flex items-center justify-center"
                      title="Back to list"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-white truncate">
                        {selectedSolution.problem_id ? `#${selectedSolution.problem_id} ` : ""}
                        {selectedSolution.problem_title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-mono bg-elevated text-secondary shrink-0">
                        {selectedSolution.language}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* 2-Page Colorful PDF button */}
                    <button
                      onClick={() => handleOpenPdfCheatsheet(selectedSolution)}
                      className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer touch-target text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20"
                      title="Download 2-Page Colorful Cheat Sheet PDF"
                    >
                      <FileText size={12} />
                      <span>2-Page PDF</span>
                    </button>

                    {/* View on GitHub */}
                    <a
                      href={`https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/blob/main/solutions/${selectedSolution.folder || selectedSolution.problem_slug}/solution.py`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer text-muted hover:text-white touch-target"
                      title="View Solution on GitHub Repository"
                    >
                      <GitBranch size={13} />
                    </a>

                    {/* Copy and Submit to LeetCode */}
                    <button
                      onClick={() => handleCopyAndSubmit(selectedSolution)}
                      className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer touch-target text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                      title="Copy Solution & Open LeetCode"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">Submit</span>
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
                      title="Download Source File"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

                {/* Sub-navigation tabs: Online Book vs Code vs Cheat Sheet */}
                <div
                  className="flex items-center px-4 border-b gap-4 text-xs font-semibold"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border-subtle)",
                  }}
                >
                  <button
                    onClick={() => setActiveTab("book")}
                    className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "book"
                        ? "border-accent text-white"
                        : "border-transparent text-muted hover:text-white"
                    }`}
                  >
                    <BookOpen size={14} className="text-accent" />
                    <span>Online Book Chapter ({explanationLang === "english" ? "English" : "Hinglish"})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("code")}
                    className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "code"
                        ? "border-accent text-white"
                        : "border-transparent text-muted hover:text-white"
                    }`}
                  >
                    <Code2 size={14} className="text-emerald-400" />
                    <span>Solution Code Editor</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("cheatsheet")}
                    className={`py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "cheatsheet"
                        ? "border-accent text-white"
                        : "border-transparent text-muted hover:text-white"
                    }`}
                  >
                    <Printer size={14} className="text-cyan-400" />
                    <span>2-Page PDF Preview</span>
                  </button>
                </div>

                {/* Tab 1: Online Book Chapter Content */}
                {activeTab === "book" && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
                    {/* Chapter Header Card */}
                    <div className="p-4 rounded-xl border bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/30 border-indigo-500/30 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                          <span>📖</span>
                          <span>
                            Chapter {selectedSolution.problem_id || "1"}: {selectedSolution.problem_title}
                          </span>
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {explanationLang.toUpperCase()} EDITION
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200">
                        {explanationLang === "english"
                          ? selectedSolution.summary_english ||
                            "A complete algorithmic breakdown with intuition, memory tricks, and optimal implementation."
                          : selectedSolution.summary_hinglish ||
                            "Problem ka asaan bhasha me solution, yaad rakhne ki trick aur step-by-step reasoning."}
                      </p>
                    </div>

                    {/* Topics Need to Know (Prerequisites) */}
                    <div className="card space-y-2">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Layers size={14} className="text-indigo-400" />
                        <span>
                          {explanationLang === "english"
                            ? "Topics You Need to Know (Prerequisites)"
                            : "Kaunse Topics Pata Hone Chahiye? (Prerequisites)"}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedSolution.topics_needed || selectedSolution.tags || ["Graph Traversal", "Matrix", "DFS"]).map(
                          (topic) => (
                            <span
                              key={topic}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            >
                              {topic}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Core Concept Used */}
                    <div className="card space-y-2 border-l-4 border-l-indigo-500">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                        <Lightbulb size={14} className="text-amber-400" />
                        <span>
                          {explanationLang === "english" ? "Core Concept Used" : "Main Concept (Kaise Kaam Karta Hai?)"}
                        </span>
                      </h3>
                      <p className="text-xs text-secondary leading-relaxed">
                        {selectedSolution.concept ||
                          "Graph connected components traversal. Mark visited cells in-place to avoid duplicate processing."}
                      </p>
                    </div>

                    {/* Trick to Remember (Mental Model) - Key Feature */}
                    <div className="p-4 rounded-xl border bg-gradient-to-r from-amber-950/40 to-yellow-950/20 border-amber-500/30 space-y-2">
                      <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <span>⚡</span>
                        <span>
                          {explanationLang === "english"
                            ? "Trick to Remember (Interview Intuition)"
                            : "Yaad Rakhne Ki Mast Trick (Interview Formula)"}
                        </span>
                      </h3>
                      <p className="text-xs text-amber-100 font-medium leading-relaxed">
                        {explanationLang === "english"
                          ? selectedSolution.trick_english ||
                            "Sink and Sum on sight: Treat any unvisited positive cell as an island root. Sink visited nodes immediately to 0 and verify the component accumulator."
                          : selectedSolution.trick_hinglish ||
                            "Dekhte hi sink karo aur jodte chalo! Positive cell milte hi DFS chalao, cells ko 0 kar do aur last me `% k == 0` check kar lo!"}
                      </p>
                    </div>

                    {/* All Stages Summary */}
                    {selectedSolution.stages_summary && selectedSolution.stages_summary.length > 0 && (
                      <div className="card space-y-3">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          <span>
                            {explanationLang === "english"
                              ? "All Stages Summary (Agent Reasoning Lifecycle)"
                              : "Saare Stages Ka Step-By-Step Breakdown"}
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedSolution.stages_summary.map((st, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg border text-xs"
                              style={{
                                background: "var(--color-bg-secondary)",
                                borderColor: "var(--color-border-subtle)",
                              }}
                            >
                              <span className="font-bold text-cyan-300">Stage {i + 1}: {st.stage}</span>
                              <p className="text-muted mt-1 text-[11px] leading-relaxed">{st.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Code Preview */}
                    <div className="card space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <Code2 size={14} className="text-accent" />
                          <span>Solution Code (Python)</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab("code")}
                          className="text-xs text-accent hover:underline cursor-pointer"
                        >
                          Open in Full Monaco Editor →
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#111827] text-gray-200 font-mono text-xs overflow-x-auto border border-gray-800">
                        <code>{selectedSolution.code}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tab 2: Code Editor */}
                {activeTab === "code" && (
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
                )}

                {/* Tab 3: 2-Page Colorful Cheat Sheet Preview */}
                {activeTab === "cheatsheet" && (
                  <div className="flex-1 w-full h-full flex flex-col p-2 bg-[#0f172a]">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-t-lg border-b border-slate-700">
                      <span className="text-xs font-semibold text-slate-200">
                        📄 2-Page Colorful PDF Cheat Sheet (Strict Max 2 Pages)
                      </span>
                      <button
                        onClick={() => handleOpenPdfCheatsheet(selectedSolution)}
                        className="px-3 py-1 bg-cyan-500 text-slate-900 rounded font-bold text-xs flex items-center gap-1 hover:bg-cyan-400 cursor-pointer"
                      >
                        <Printer size={12} />
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                    <iframe
                      src={`./solutions/${selectedSolution.folder || selectedSolution.problem_slug}/cheatsheet.html`}
                      className="w-full flex-1 border-0 rounded-b-lg bg-white"
                      title="2-Page Cheat Sheet Preview"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-xs text-muted flex items-center justify-center h-full">
                Select a solution chapter to read.
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
